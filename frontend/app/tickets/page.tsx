'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'Avoin' | 'Työn alla' | 'Odottaa' | 'Valmis' | 'Keskeytetty'
type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

type Ticket = {
  id: string
  title: string
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

const allStatuses: Status[] = ['Avoin', 'Työn alla', 'Odottaa', 'Valmis', 'Keskeytetty']

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | 'Kaikki'>('Kaikki')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
  setToken(localStorage.getItem('token'))
  setName(localStorage.getItem('name'))
}, [])
useEffect(() => {
  if (token === null) return
  if (!token) { router.push('/login'); return }
  fetchTickets()
}, [token])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/tickets?token=${token}`)
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setTickets(data)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fi-FI')
  }

  const filtered = tickets.filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.company || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Kaikki' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="border-b border-[#21262d] bg-[#161b22] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-sm">CloudwebAI Helpdesk</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/tickets" className="text-white font-medium">Tiketit</a>
            <a href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">Dashboard</a>
            <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">Admin</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{name}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Kirjaudu ulos</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 w-full flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-medium">Tikettilista</h1>
              <p className="text-gray-500 text-sm mt-1">{filtered.length} tikettia</p>
            </div>
            <button
              onClick={fetchTickets}
              className="flex items-center gap-2 border border-[#21262d] text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Päivitä
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Hae tikettiä, asiakasta, yritystä..."
                className="w-full bg-[#161b22] border border-[#21262d] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {(['Kaikki', ...allStatuses] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-transparent border-[#21262d] text-gray-500 hover:border-[#30363d]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            {loading ? (
              <div className="text-center text-gray-500 py-12">Ladataan...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Otsikko</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Asiakas</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Tila</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Prioriteetti</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Agentti</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Päivitetty</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ticket => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelected(selected?.id === ticket.id ? null : ticket)}
                      className={`border-b border-[#21262d] last:border-0 cursor-pointer transition-colors ${
                        selected?.id === ticket.id ? 'bg-blue-500/5' : 'hover:bg-[#1c2128]'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{ticket.title}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{ticket.customer}</div>
                        <div className="text-xs text-gray-500">{ticket.company}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {ticket.agent ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(ticket.updated_at)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-600 text-sm">
                        Ei tikettejä
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-gray-500">{selected.id.slice(0,8)}...</span>
                <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h3 className="font-medium text-sm mb-4">{selected.title}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tila</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prioriteetti</span>
                  <span className={`text-xs font-medium ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Asiakas</span>
                  <span className="text-gray-300 text-xs">{selected.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Yritys</span>
                  <span className="text-gray-300 text-xs">{selected.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sähköposti</span>
                  <span className="text-blue-400 text-xs">{selected.customer_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Puhelin</span>
                  <span className="text-gray-300 text-xs">{selected.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Agentti</span>
                  <span className="text-gray-300 text-xs">{selected.agent ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Luotu</span>
                  <span className="text-gray-300 text-xs">{formatDate(selected.created_at)}</span>
                </div>
                {selected.time_spent_seconds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Työaika</span>
                    <span className="text-gray-300 text-xs">{Math.round(selected.time_spent_seconds / 60)} min</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[#21262d]">
                <button
                  onClick={() => router.push(`/dashboard?ticket=${selected.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg text-center transition-colors"
                >
                  Avaa dashboardissa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}