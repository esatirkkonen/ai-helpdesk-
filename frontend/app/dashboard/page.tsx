'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'


type Status = 'Avoin' | 'Työn alla' | 'Odottaa' | 'Valmis' | 'Keskeytetty'
type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

type Ticket = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  customer: string
  customer_email: string
  customer_phone: string
  company: string
  agent: string | null
  agent_id: string | null
  time_spent_seconds: number
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
  'Avoin':       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Työn alla':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Odottaa':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Valmis':      'bg-green-500/10 text-green-400 border-green-500/20',
  'Keskeytetty': 'bg-red-500/10 text-red-400 border-red-500/20',
}

const priorityColors: Record<Priority, string> = {
  'Matala':      'text-green-400',
  'Normaali':    'text-blue-400',
  'Kiireellinen':'text-red-400',
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
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
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
    return () => { Object.values(intervalRef.current).forEach(clearInterval) }
  }, [token])

  async function fetchTickets() {
  setLoading(true)
  try {
    const res = await fetch(`http://localhost:8000/tickets?token=${token}`)
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    setTickets(data)
    if (data.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const ticketId = params.get('ticket')
      if (ticketId) {
        const found = data.find((t: Ticket) => t.id === ticketId)
        if (found) {
          setSelected(found)
          setTimeout(() => fetchComments(found.id), 0)
          return
        }
      }
      if (!selected) {
        setSelected(data[0])
        setTimeout(() => fetchComments(data[0].id), 0)
      }
    }
  } finally {
    setLoading(false)
  }
}

  async function fetchAgents() {
    const res = await fetch(`http://localhost:8000/agents?token=${token}`)
    const data = await res.json()
    setAgents(data)
  }

  async function fetchComments(ticketId: string) {
    const res = await fetch(`http://localhost:8000/tickets/${ticketId}/comments?token=${token}`)
    const data = await res.json()
     console.log('Comments received:', data)
    setComments(data)
  }

  async function updateStatus(status: Status) {
    if (!selected) return
    const res = await fetch(`http://localhost:8000/tickets/${selected.id}/status?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = { ...selected, status }
      setSelected(updated)
      setTickets(tickets.map(t => t.id === selected.id ? updated : t))
      if (status === 'Työn alla') startTimer(selected.id)
      else if (['Odottaa', 'Valmis', 'Keskeytetty'].includes(status)) stopTimer(selected.id)
    }
  }

  async function updateAgent(agentId: string) {
    if (!selected) return
    const res = await fetch(`http://localhost:8000/tickets/${selected.id}/agent?token=${token}`, {
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
      const res = await fetch(`http://localhost:8000/tickets/${selected.id}/comments?token=${token}`, {
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
    await fetch(`http://localhost:8000/tickets/${selected.id}/comments?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: internalNote, is_internal: true }),
    })
    setInternalNote('')
    await fetchComments(selected.id)
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

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  const currentTime = selected ? (timers[selected.id] || 0) + selected.time_spent_seconds : 0
  const isRunning = selected ? (running[selected.id] || false) : false
  const myTickets = tickets.filter(t => t.agent === name)
  const openTickets = tickets.filter(t => t.status === 'Avoin')

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
    <Topbar activePage="dashboard" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-[#21262d] bg-[#161b22] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[#21262d]">
            <div className="flex gap-3 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-lg flex-1 text-center">
                <div className="font-medium text-lg">{openTickets.length}</div>
                <div>Avoimet</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-2 rounded-lg flex-1 text-center">
                <div className="font-medium text-lg">{myTickets.length}</div>
                <div>Minulla</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8 text-sm">Ladataan...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">Ei tikettejä</div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`p-4 border-b border-[#21262d] cursor-pointer transition-colors ${
                    selected?.id === ticket.id
                      ? 'bg-blue-500/5 border-l-2 border-l-blue-500 pl-3.5'
                      : 'hover:bg-[#1c2128]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    {running[ticket.id] && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                        {formatTime((timers[ticket.id] || 0) + ticket.time_spent_seconds)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate mt-1">{ticket.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ticket.customer}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[selected.status]}`}>
                      {selected.status}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[selected.priority]}`}>
                      {selected.priority}
                    </span>
                  </div>
                  <h1 className="text-lg font-medium">{selected.title}</h1>
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
                      {(['Avoin', 'Työn alla', 'Odottaa', 'Valmis', 'Keskeytetty'] as Status[]).map(s => (
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

              {/* Asiakkaan tiedot */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">Asiakkaan tiedot</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Nimi</p>
                    <p className="text-gray-200">{selected.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Yritys</p>
                    <p className="text-gray-200">{selected.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Sähköposti</p>
                    <p className="text-blue-400">{selected.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Puhelin</p>
                    <p className="text-gray-200">{selected.customer_phone || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Ongelma */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Ongelma</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
              </div>

              {/* Kommenttihistoria */}
              {comments.length > 0 && (
                <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#21262d]">
                    <p className="text-xs text-gray-500">Kommenttihistoria ({comments.length})</p>
                  </div>
                  <div className="divide-y divide-[#21262d]">
                    {comments.map(comment => (
                      <div key={comment.id} className={`px-4 py-3 ${comment.is_internal ? 'bg-amber-500/5' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-300">{comment.user_name || 'Käyttäjä'}</span>
                            {comment.is_internal && (
                              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                Sisäinen muistiinpano
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">
                            {new Date(comment.created_at).toLocaleString('fi-FI')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sisäinen muistiinpano */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/5 border-b border-[#21262d]">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-400">Sisäinen muistiinpano</span>
                  <span className="text-xs text-gray-500 ml-auto">Asiakas ei näe tätä</span>
                </div>
                <div className="p-4">
                  <textarea
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    rows={3}
                    placeholder="Kirjoita sisäinen muistiinpano..."
                    className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={addInternalNote}
                    disabled={!internalNote.trim()}
                    className="flex items-center gap-1.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    Tallenna muistiinpano
                  </button>
                </div>
              </div>

              {/* Vastaus asiakkaalle */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/5 border-b border-[#21262d]">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-400">Vastaus asiakkaalle</span>
                </div>
                <div className="p-4">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={5}
                    placeholder="Kirjoita vastaus asiakkaalle..."
                    className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    {sending ? 'Lähetetään...' : 'Lähetä vastaus asiakkaalle'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Valitse tiketti vasemmalta</p>
          </div>
        )}
      </div>
    </div>
  )
}
