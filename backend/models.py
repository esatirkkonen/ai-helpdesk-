from sqlalchemy import Column, String, Boolean, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Company(Base):
    __tablename__ = "companies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="customer")
    phone = Column(String(50))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    company = relationship("Company", back_populates="users")
    tickets_created = relationship("Ticket", foreign_keys="Ticket.customer_id", back_populates="customer")
    tickets_assigned = relationship("Ticket", foreign_keys="Ticket.agent_id", back_populates="agent")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="Avoin")
    priority = Column(String(20), default="Normaali")
    ticket_type = Column(String(50), default="Incident")
    time_spent_seconds = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    customer = relationship("User", foreign_keys=[customer_id], back_populates="tickets_created")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="tickets_assigned")
    comments = relationship("Comment", back_populates="ticket")
    time_logs = relationship("TimeLog", back_populates="ticket")
    ai_suggestions = relationship("AISuggestion", back_populates="ticket")
    

class TimeLog(Base):
    __tablename__ = "time_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    started_at = Column(DateTime)
    stopped_at = Column(DateTime, nullable=True)
    seconds = Column(Integer, default=0)
    reason = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("Ticket", back_populates="time_logs")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("Ticket", back_populates="comments")

class EmailLog(Base):
    __tablename__ = "email_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    to_email = Column(String(255))
    subject = Column(String(255))
    type = Column(String(50))
    sent_at = Column(DateTime, default=datetime.utcnow)

class AISuggestion(Base):
    __tablename__ = "ai_suggestions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    original_suggestion = Column(Text)
    final_response = Column(Text)
    outcome = Column(String(20))
    similarity_score = Column(Float)
    model_used = Column(String(100))
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("Ticket", back_populates="ai_suggestions")

class SolutionKB(Base):
    __tablename__ = "solution_kb"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"))
    problem_category = Column(String(100))
    problem_keywords = Column(Text)
    solution_text = Column(Text)
    times_used = Column(Integer, default=1)
    success_rate = Column(Float, default=1.0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)