from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import uuid

from database import get_db, engine
from models import Base, User, Company, Ticket, TimeLog, Comment, AISuggestion
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

# Luo taulut jos ei ole olemassa
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CloudwebAI Helpdesk API")

# CORS — sallii frontendin puhua backendille
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Salasanan salaus
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT asetukset
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# ── Pydantic-mallit (mitä frontend lähettää) ──────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "Normaali"

class TicketStatusUpdate(BaseModel):
    status: str

class TicketAgentUpdate(BaseModel):
    agent_id: str

class TicketReply(BaseModel):
    message: str
    original_suggestion: Optional[str] = None
    outcome: str = "accepted"

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "customer"
    phone: Optional[str] = None
    company_id: Optional[str] = None

class CompanyCreate(BaseModel):
    name: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None

# ── Auth apufunktiot ──────────────────────────────────────────

def verify_password(plain, hashed):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Virheellinen token")
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="Käyttäjää ei löydy")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Virheellinen token")

# ── Endpointit ────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "CloudwebAI Helpdesk API"}

# Kirjautuminen
@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Väärä sähköposti tai salasana")
    if not user.active:
        raise HTTPException(status_code=401, detail="Tili on deaktivoitu")
    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "id": str(user.id)
    }

# ── Tiketit ───────────────────────────────────────────────────

@app.get("/tickets")
def get_tickets(
    token: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    query = db.query(Ticket)

    # Asiakas näkee vain omat tikettinsä
    if user.role == "customer":
        query = query.filter(Ticket.customer_id == user.id)
    # Agentti/admin näkee kaikki
    if status:
        query = query.filter(Ticket.status == status)

    tickets = query.order_by(Ticket.created_at.desc()).all()

    return [{
        "id": str(t.id),
        "title": t.title,
        "description": t.description,
        "status": t.status,
        "priority": t.priority,
        "customer": t.customer.name if t.customer else None,
        "customer_email": t.customer.email if t.customer else None,
        "customer_phone": t.customer.phone if t.customer else None,
        "company": t.customer.company.name if t.customer and t.customer.company else None,
        "agent": t.agent.name if t.agent else None,
        "agent_id": str(t.agent_id) if t.agent_id else None,
        "time_spent_seconds": t.time_spent_seconds,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    } for t in tickets]

@app.post("/tickets")
def create_ticket(
    req: TicketCreate,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    ticket = Ticket(
        customer_id=user.id,
        title=req.title,
        description=req.description,
        priority=req.priority,
        status="Avoin"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"id": str(ticket.id), "title": ticket.title, "status": ticket.status}

@app.put("/tickets/{ticket_id}/status")
def update_status(
    ticket_id: str,
    req: TicketStatusUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    ticket = db.query(Ticket).filter(Ticket.id == uuid.UUID(ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Tiketti ei löydy")

    old_status = ticket.status
    ticket.status = req.status
    ticket.updated_at = datetime.utcnow()

    # Ajanlasku logiikka
    if req.status == "Työn alla" and old_status != "Työn alla":
        if not ticket.started_at:
            ticket.started_at = datetime.utcnow()
        time_log = TimeLog(
            ticket_id=ticket.id,
            agent_id=user.id,
            started_at=datetime.utcnow(),
            reason="started"
        )
        db.add(time_log)

    elif req.status in ["Odottaa", "Valmis", "Keskeytetty"] and old_status == "Työn alla":
        log = db.query(TimeLog).filter(
            TimeLog.ticket_id == ticket.id,
            TimeLog.stopped_at == None
        ).first()
        if log:
            log.stopped_at = datetime.utcnow()
            log.seconds = int((log.stopped_at - log.started_at).total_seconds())

        if req.status == "Valmis":
            ticket.resolved_at = datetime.utcnow()
            total = db.query(TimeLog).filter(TimeLog.ticket_id == ticket.id).all()
            ticket.time_spent_seconds = sum(l.seconds or 0 for l in total)

    db.commit()
    return {"status": ticket.status, "updated_at": ticket.updated_at.isoformat()}

@app.put("/tickets/{ticket_id}/agent")
def update_agent(
    ticket_id: str,
    req: TicketAgentUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    get_current_user(token, db)
    ticket = db.query(Ticket).filter(Ticket.id == uuid.UUID(ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Tiketti ei löydy")
    ticket.agent_id = uuid.UUID(req.agent_id)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    return {"agent_id": req.agent_id}

@app.post("/tickets/{ticket_id}/reply")
def reply_ticket(
    ticket_id: str,
    req: TicketReply,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    ticket = db.query(Ticket).filter(Ticket.id == uuid.UUID(ticket_id)).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Tiketti ei löydy")

    # Tallenna kommentti
    comment = Comment(
        ticket_id=ticket.id,
        user_id=user.id,
        content=req.message,
        is_internal=False
    )
    db.add(comment)

    # Tallenna AI-ehdotus jos oli
    if req.original_suggestion:
        suggestion = AISuggestion(
            ticket_id=ticket.id,
            agent_id=user.id,
            original_suggestion=req.original_suggestion,
            final_response=req.message,
            outcome=req.outcome
        )
        db.add(suggestion)

    ticket.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "lähetetty"}

# ── Käyttäjät ─────────────────────────────────────────────────

@app.get("/users")
def get_users(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Ei oikeuksia")
    users = db.query(User).all()
    return [{
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "company": u.company.name if u.company else None,
        "company_id": str(u.company_id) if u.company_id else None,
        "active": u.active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]

@app.post("/users")
def create_user(req: UserCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Ei oikeuksia")
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sähköposti on jo käytössä")
    new_user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
        phone=req.phone,
        company_id=uuid.UUID(req.company_id) if req.company_id else None,
        active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": str(new_user.id), "name": new_user.name, "email": new_user.email}

@app.put("/users/{user_id}/active")
def toggle_active(user_id: str, token: str, db: Session = Depends(get_db)):
    admin = get_current_user(token, db)
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Ei oikeuksia")
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Käyttäjää ei löydy")
    user.active = not user.active
    db.commit()
    return {"active": user.active}

# ── Yritykset ─────────────────────────────────────────────────

@app.get("/companies")
def get_companies(token: str, db: Session = Depends(get_db)):
    get_current_user(token, db)
    companies = db.query(Company).all()
    return [{
        "id": str(c.id),
        "name": c.name,
        "contact_email": c.contact_email,
        "phone": c.phone,
        "user_count": len(c.users),
        "created_at": c.created_at.isoformat() if c.created_at else None,
    } for c in companies]

@app.post("/companies")
def create_company(req: CompanyCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Ei oikeuksia")
    company = Company(
        name=req.name,
        contact_email=req.contact_email,
        phone=req.phone
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"id": str(company.id), "name": company.name}

# ── Agentit ───────────────────────────────────────────────────

@app.get("/agents")
def get_agents(token: str, db: Session = Depends(get_db)):
    get_current_user(token, db)
    agents = db.query(User).filter(User.role.in_(["agent", "admin"])).all()
    return [{
        "id": str(a.id),
        "name": a.name,
        "email": a.email,
    } for a in agents]

# ── Kommentit ─────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False

@app.get("/tickets/{ticket_id}/comments")
def get_comments(ticket_id: str, token: str, db: Session = Depends(get_db)):
    get_current_user(token, db)
    comments = db.query(Comment).filter(
        Comment.ticket_id == uuid.UUID(ticket_id)
    ).order_by(Comment.created_at.asc()).all()
    return [{
        "id": str(c.id),
        "content": c.content,
        "is_internal": c.is_internal,
        "created_at": c.created_at.isoformat(),
        "user_id": str(c.user_id),
    } for c in comments]

@app.post("/tickets/{ticket_id}/comments")
def add_comment(
    ticket_id: str,
    req: CommentCreate,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    comment = Comment(
        ticket_id=uuid.UUID(ticket_id),
        user_id=user.id,
        content=req.content,
        is_internal=req.is_internal
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id": str(comment.id),
        "content": comment.content,
        "is_internal": comment.is_internal,
        "created_at": comment.created_at.isoformat(),
        "user_id": str(user.id),
        "user_name": user.name,
    }