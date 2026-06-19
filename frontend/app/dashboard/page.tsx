'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import TicketSidebar from '@/components/dashboard/TicketSidebar'
import CustomerInfo from '@/components/dashboard/CustomerInfo'
import SLAPanel from '@/components/dashboard/SLAPanel'
import CommentHistory from '@/components/dashboard/CommentHistory'
import InternalNote from '@/components/dashboard/InternalNote'
import ReplyBox from '@/components/dashboard/ReplyBox'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityBadge from '@/components/shared/PriorityBadge'
import TypeBadge from '@/components/shared/TypeBadge'

type Status = 'Uusi' | 'Luokiteltu' | 'Käsittelyssä' | 'Odottaa' | 'Ratkaistu' | 'Suljettu'
type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

type Ticket = {
  id: string
  ticket_number: number
  title: string
  description: string
  status: Status
  priority: Priority
  ticket_type: string
  customer: string
  customer_email: string
  customer_phone: string
  company: string
  agent: string | null
  agent_id: string | null
  time_spent_seconds: number
  first_response_deadline: string | null
  resolution_deadline: string | null
  sla_breached: boolean
  created_at: string
  updated_at: string
}

type Agent = {
  id: string
  name: string
  email: string
}

type Comment = {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user_id: string
  user_name: string
}

const statusColors: Record<Status, string> = {
  'Uusi':         'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Luokiteltu':   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Käsittelyssä': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Odottaa':      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Ratkaistu':    'bg-green-500/10 text-green-400 border-green-500/20',
  'Suljettu':     'bg-gray-500/10 text-gray-300 border-gray-500/20',
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fi-FI')
}

export default function DashboardPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [timers, setTimers] = useState<Record<string, number>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Comment[]>([])
  const [internalNote, setInternalNote] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null)
  const [ticketType, setTicketType] = useState('Incident')
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [customers, setCustomers] = useState<{id: string, name: string, email: string, company: string}[]>([])
  const [newTicketTitle, setNewTicketTitle] = useState('')
  const [newTicketDesc, setNewTicketDesc] = useState('')
  const [newTicketPriority, setNewTicketPriority] = useState('Normaali')
  const [newTicketType, setNewTicketType] = useState('Incident')
  const [newTicketCustomer, setNewTicketCustomer] = useState('')
  const [creatingTicket, setCreatingTicket] = useState(false)
  const intervalRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    setToken(localStorage.getItem('token'))
    setName(localStorage.getItem('name'))
  }, [])

  useEffect(() => {
    if (token === null) return
    if (!token) { router.push('/login'); return }
    fetchTickets()
    fetchAgents()
    fetchCustomers()
    return () => { Object.values(intervalRef.current).forEach(clearInterval) }
  }, [token])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets?token=${token}`)
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      const ticketList = Array.isArray(data) ? data : []
      setTickets(ticketList)
      if (ticketList.length > 0) {
        const params = new URLSearchParams(window.location.search)
        const ticketId = params.get('ticket')
        if (ticketId) {
          const found = ticketList.find((t: Ticket) => t.id === ticketId)
          if (found) {
            setSelected(found)
            setTimeout(() => fetchComments(found.id), 0)
            return
          }
        }
        if (!selected) {
          setSelected(ticketList[0])
          setTimeout(() => fetchComments(ticketList[0].id), 0)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchAgents() {
    try {
      const res = await fetch(`https://cloudwebai-backend.onrender.com/agents?token=${token}`)
      const data = await res.json()
      setAgents(Array.isArray(data) ? data : [])
    } catch { setAgents([]) }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch(`https://cloudwebai-backend.onrender.com/customers?token=${token}`)
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch { setCustomers([]) }
  }

  async function fetchComments(ticketId: string) {
    try {
      const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets/${ticketId}/comments?token=${token}`)
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch { setComments([]) }
  }

  async function updateStatus(status: Status) {
    if (!selected) return
    if (status === 'Luokiteltu') {
      setPendingStatus(status)
      setShowTypeModal(true)
      return
    }
    const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/status?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = { ...selected, status }
      setSelected(updated)
      setTickets(tickets.map(t => t.id === selected.id ? updated : t))
      if (status === 'Käsittelyssä') startTimer(selected.id)
      else if (['Odottaa', 'Ratkaistu', 'Suljettu'].includes(status)) stopTimer(selected.id)
    }
  }

  async function confirmClassification() {
    if (!selected || !pendingStatus) return
    await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/type?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_type: ticketType }),
    })
    const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/status?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: pendingStatus }),
    })
    if (res.ok) {
      const updated = { ...selected, status: pendingStatus, ticket_type: ticketType }
      setSelected(updated)
      setTickets(tickets.map(t => t.id === selected.id ? updated : t))
    }
    setShowTypeModal(false)
    setPendingStatus(null)
  }

  async function updateAgent(agentId: string) {
    if (!selected) return
    const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/agent?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId }),
    })
    if (res.ok) {
      const agent = agents.find(a => a.id === agentId)
      const updated = { ...selected, agent: agent?.name || null, agent_id: agentId }
      setSelected(updated)
      setTickets(tickets.map(t => t.id === selected.id ? updated : t))
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/comments?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply, is_internal: false }),
      })
      if (res.ok) {
        setReply('')
        await fetchComments(selected.id)
        await fetchTickets()
      }
    } finally {
      setSending(false)
    }
  }

  async function addInternalNote() {
    if (!selected || !internalNote.trim()) return
    await fetch(`https://cloudwebai-backend.onrender.com/tickets/${selected.id}/comments?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: internalNote, is_internal: true }),
    })
    setInternalNote('')
    await fetchComments(selected.id)
  }

 async function createTicketAsAgent(e: React.FormEvent) {
  e.preventDefault()
  if (!newTicketCustomer) return
  setCreatingTicket(true)
  try {
    const res = await fetch(`https://cloudwebai-backend.onrender.com/agent-ticket?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTicketTitle,
        description: newTicketDesc,
        priority: newTicketPriority,
        ticket_type: newTicketType,
        customer_id: newTicketCustomer,
      }),
    })
    setShowNewTicketModal(false)
    setNewTicketTitle('')
    setNewTicketDesc('')
    setNewTicketPriority('Normaali')
    setNewTicketType('Incident')
    setNewTicketCustomer('')
    if (res.ok) {
      await fetchTickets()
    }
  } finally {
    setCreatingTicket(false)
  }
}

  function startTimer(id: string) {
    if (intervalRef.current[id]) return
    setRunning(r => ({ ...r, [id]: true }))
    intervalRef.current[id] = setInterval(() => {
      setTimers(t => ({ ...t, [id]: (t[id] || 0) + 1 }))
    }, 1000)
  }

  function stopTimer(id: string) {
    clearInterval(intervalRef.current[id])
    delete intervalRef.current[id]
    setRunning(r => ({ ...r, [id]: false }))
  }

  function selectTicket(ticket: Ticket) {
    setSelected(ticket)
    setReply('')
    setInternalNote('')
    setComments([])
    setTimeout(() => fetchComments(ticket.id), 0)
  }

  const currentTime = selected ? (timers[selected.id] || 0) + selected.time_spent_seconds : 0
  const isRunning = selected ? (running[selected.id] || false) : false
  const myTickets = Array.isArray(tickets) ? tickets.filter(t => t.agent === name) : []
  const openTickets = Array.isArray(tickets) ? tickets.filter(t => t.status === 'Uusi' || t.status === 'Luokiteltu') : []

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <Topbar activePage="dashboard" />

      <div className="flex flex-1 overflow-hidden">
        <TicketSidebar
          tickets={tickets}
          selected={selected}
          loading={loading}
          filter={filter}
          name={name}
          timers={timers}
          running={running}
          onSelect={selectTicket}
          onFilterChange={setFilter}
          onNewTicket={() => setShowNewTicketModal(true)}
          openCount={openTickets.length}
          myCount={myTickets.length}
        />

        {selected ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={selected.status} />
                    <PriorityBadge priority={selected.priority} />
                    {selected.ticket_type && <TypeBadge type={selected.ticket_type} />}
                  </div>
                  <h1 className="text-lg font-medium">
                    <span className="text-gray-500 font-mono text-sm mr-2">
                      #{String(selected.ticket_number || 0).padStart(4, '0')}
                    </span>
                    {selected.title}
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">Luotu {formatDate(selected.created_at)}</p>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-3 text-center min-w-[140px]">
                  <div className={`text-xl font-mono font-medium ${isRunning ? 'text-blue-400' : 'text-gray-400'}`}>
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {isRunning ? '● Laskee aikaa' : '○ Pysäytetty'}
                  </div>
                </div>
              </div>

              {/* Tila + Agentti */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Vaihda tila</p>
                    <div className="flex flex-wrap gap-2">
                      {(['Uusi', 'Luokiteltu', 'Käsittelyssä', 'Odottaa', 'Ratkaistu', 'Suljettu'] as Status[]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            selected.status === s
                              ? statusColors[s]
                              : 'border-[#30363d] text-gray-500 hover:border-[#484f58]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Agentti</p>
                    <select
                      value={selected.agent_id || ''}
                      onChange={e => updateAgent(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">— Ei agenttia —</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <CustomerInfo
                customer={selected.customer}
                company={selected.company}
                email={selected.customer_email}
                phone={selected.customer_phone}
              />

              <SLAPanel
                firstResponseDeadline={selected.first_response_deadline}
                resolutionDeadline={selected.resolution_deadline}
                slaBreached={selected.sla_breached}
              />

              {/* Ongelma */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Ongelma</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
              </div>

              <CommentHistory comments={comments} />

              <InternalNote
                value={internalNote}
                onChange={setInternalNote}
                onSave={addInternalNote}
              />

              <ReplyBox
                value={reply}
                onChange={setReply}
                onSend={sendReply}
                sending={sending}
              />

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Valitse tiketti vasemmalta</p>
          </div>
        )}
      </div>

      {/* Tikettityyppi-modaali */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Luokittele tiketti</h2>
              <p className="text-xs text-gray-500 mt-1">Valitse tikettityyppi ennen luokittelua</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { type: 'Incident', desc: 'Jokin ei toimi — häiriö', color: 'border-red-500/40 text-red-400 bg-red-500/5' },
                { type: 'Service Request', desc: 'Uusi pyyntö — asennus, käyttäjätunnus', color: 'border-blue-500/40 text-blue-400 bg-blue-500/5' },
                { type: 'Problem', desc: 'Toistuva häiriö — juurisyyn selvitys', color: 'border-amber-500/40 text-amber-400 bg-amber-500/5' },
                { type: 'Change', desc: 'Inframuutos — päivitys, laitevaihto', color: 'border-purple-500/40 text-purple-400 bg-purple-500/5' },
              ].map(({ type, desc, color }) => (
                <button
                  key={type}
                  onClick={() => setTicketType(type)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    ticketType === type ? color : 'border-[#30363d] text-gray-400 hover:border-[#484f58]'
                  }`}
                >
                  <div className="font-medium text-sm">{type}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowTypeModal(false); setPendingStatus(null) }}
                className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">
                Peruuta
              </button>
              <button onClick={confirmClassification}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                Luokittele tiketti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uusi tiketti -modaali */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Luo tiketti asiakkaalle</h2>
              <button onClick={() => setShowNewTicketModal(false)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={createTicketAsAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Asiakas</label>
                <select value={newTicketCustomer} onChange={e => setNewTicketCustomer(e.target.value)} required
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">— Valitse asiakas —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Otsikko</label>
                <input value={newTicketTitle} onChange={e => setNewTicketTitle(e.target.value)} required
                  placeholder="Lyhyt kuvaus ongelmasta"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Kuvaus</label>
                <textarea value={newTicketDesc} onChange={e => setNewTicketDesc(e.target.value)} required
                  rows={3} placeholder="Tarkempi kuvaus..."
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Tikettityyppi</label>
                <select value={newTicketType} onChange={e => setNewTicketType(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="Incident">Incident — häiriö</option>
                  <option value="Service Request">Service Request — pyyntö</option>
                  <option value="Problem">Problem — toistuva häiriö</option>
                  <option value="Change">Change — muutos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Prioriteetti</label>
                <div className="flex gap-2">
                  {(['Matala', 'Normaali', 'Kiireellinen'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setNewTicketPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${
                        newTicketPriority === p
                          ? p === 'Kiireellinen' ? 'bg-red-500/10 border-red-500/40 text-red-400'
                          : p === 'Normaali' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                          : 'bg-green-500/10 border-green-500/40 text-green-400'
                          : 'border-[#30363d] text-gray-500 hover:border-[#484f58]'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">
                  Peruuta
                </button>
                <button type="submit" disabled={creatingTicket || !newTicketCustomer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                  {creatingTicket ? 'Luodaan...' : 'Luo tiketti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

