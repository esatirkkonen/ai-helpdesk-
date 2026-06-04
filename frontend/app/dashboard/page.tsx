'use client'

import { useState, useEffect, useRef } from 'react'

type Status = 'Avoin' | 'Työn alla' | 'Odottaa' | 'Valmis' | 'Keskeytetty'
type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

type Ticket = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  customer: string
  email: string
  phone: string
  company: string
  agent: string | null
  created: string
  timeSpent: number
}

const mockTickets: Ticket[] = [
  { id: '#1042', title: 'VPN ei toimi etätöissä', description: 'En pääse VPN:lle töihin tullessani. Cisco AnyConnect antaa virheen "Connection attempt has failed". Olen jo käynnistänyt koneen uudelleen useita kertoja.', status: 'Avoin', priority: 'Kiireellinen', customer: 'Jukka Korhonen', email: 'jukka.korhonen@acme.fi', phone: '+358 40 123 4567', company: 'Acme Oy', agent: null, created: '3.6.2025 09:14', timeSpent: 0 },
  { id: '#1041', title: 'Outlook kaatuu käynnistyksessä', description: 'Outlook sulkeutuu heti avattaessa. Virheilmoitus: "Microsoft Outlook has stopped working". Ongelma alkoi tänään aamulla päivityksen jälkeen.', status: 'Avoin', priority: 'Normaali', customer: 'Sari Mäkinen', email: 'sari.makinen@beta.fi', phone: '+358 50 234 5678', company: 'Beta Corp', agent: null, created: '3.6.2025 08:52', timeSpent: 0 },
  { id: '#1040', title: 'Teams-asennus epäonnistuu', description: 'Yritin asentaa Microsoft Teamsin mutta saan virheen "Installation failed, error 1603". Tarvitsen Teamsin tänään kokousta varten klo 14.', status: 'Työn alla', priority: 'Normaali', customer: 'Anna Lehtinen', email: 'anna.lehtinen@acme.fi', phone: '+358 45 345 6789', company: 'Acme Oy', agent: 'Matti Tukihenkilö', created: '2.6.2025 15:30', timeSpent: 1240 },
  { id: '#1039', title: 'Salasana vanhentunut', description: 'Salasanani on vanhentunut eikä Windows päästä kirjautumaan. Tarvitsen apua kiireesti.', status: 'Valmis', priority: 'Matala', customer: 'Pekka Virtanen', email: 'pekka.virtanen@gamma.fi', phone: '+358 40 456 7890', company: 'Gamma Ltd', agent: 'Tiina Agentti', created: '1.6.2025 11:20', timeSpent: 540 },
]

const agents = ['Matti Tukihenkilö', 'Tiina Agentti', 'Erkki Helpdesk']

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

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [selected, setSelected] = useState<Ticket>(mockTickets[0])
  const [aiSuggestion] = useState(`Hei ${mockTickets[0].customer.split(' ')[0]},\n\nKokeile seuraavia askelia järjestyksessä:\n1. Varmista internet-yhteys ensin\n2. Palvelin: vpn.acme.fi — käytä työsähköpostiasi\n3. Avaa Microsoft Authenticator ja käytä siellä näkyvää koodia\n4. Jos ongelma jatkuu, poista AnyConnect ja asenna uudelleen Software Centeristä\n\nYstävällisin terveisin,\nIT-tuki`)
  const [editedSuggestion, setEditedSuggestion] = useState(aiSuggestion)
  const [editing, setEditing] = useState(false)
  const [timers, setTimers] = useState<Record<string, number>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const intervalRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    return () => {
      Object.values(intervalRef.current).forEach(clearInterval)
    }
  }, [])

  function selectTicket(ticket: Ticket) {
    setSelected(ticket)
    setEditedSuggestion(`Hei ${ticket.customer.split(' ')[0]},\n\nOlemme vastaanottaneet tikettisi ja tutkimme ongelmaa parhaillaan.\n\nYstävällisin terveisin,\nIT-tuki`)
    setEditing(false)
  }

  function updateStatus(status: Status) {
    const updated = tickets.map(t =>
      t.id === selected.id ? { ...t, status } : t
    )
    setTickets(updated)
    setSelected({ ...selected, status })

    if (status === 'Työn alla') {
      startTimer(selected.id)
    } else if (status === 'Odottaa' || status === 'Valmis' || status === 'Keskeytetty') {
      stopTimer(selected.id)
    }
  }

  function updateAgent(agent: string) {
    const updated = tickets.map(t =>
      t.id === selected.id ? { ...t, agent } : t
    )
    setTickets(updated)
    setSelected({ ...selected, agent })
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

  const currentTime = (timers[selected.id] || 0) + selected.timeSpent
  const isRunning = running[selected.id] || false

  const myTickets = tickets.filter(t => t.agent === 'Matti Tukihenkilö')
  const openTickets = tickets.filter(t => t.status === 'Avoin')

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* Topbar */}
      <div className="border-b border-[#21262d] bg-[#161b22] flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-sm">CloudwebAI Helpdesk</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/tickets" className="text-gray-500 hover:text-gray-300 transition-colors">Tiketit</a>
            <a href="/dashboard" className="text-white font-medium">Dashboard</a>
            <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">Admin</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-400">Matti Tukihenkilö</span>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Kirjaudu ulos</button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar: ticket list */}
        <div className="w-72 border-r border-[#21262d] bg-[#161b22] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[#21262d]">
            <div className="flex gap-3 text-xs mb-3">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg flex-1 text-center">
                <div className="font-medium text-base">{openTickets.length}</div>
                <div>Avoimet</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg flex-1 text-center">
                <div className="font-medium text-base">{myTickets.length}</div>
                <div>Minulla</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => selectTicket(ticket)}
                className={`p-4 border-b border-[#21262d] cursor-pointer transition-colors ${
                  selected.id === ticket.id
                    ? 'bg-blue-500/5 border-l-2 border-l-blue-500'
                    : 'hover:bg-[#1c2128]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-500">{ticket.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm font-medium truncate mb-1">{ticket.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{ticket.customer}</span>
                  {(running[ticket.id] || false) && (
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                      {formatTime((timers[ticket.id] || 0) + ticket.timeSpent)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main: ticket detail */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{selected.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[selected.status]}`}>
                    {selected.status}
                  </span>
                  <span className={`text-xs font-medium ${priorityColors[selected.priority]}`}>
                    {selected.priority}
                  </span>
                </div>
                <h1 className="text-lg font-medium">{selected.title}</h1>
                <p className="text-xs text-gray-500 mt-1">Luotu {selected.created}</p>
              </div>

              {/* Timer */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl px-4 py-3 text-center min-w-[140px]">
                <div className={`text-xl font-mono font-medium ${isRunning ? 'text-blue-400' : 'text-gray-400'}`}>
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {isRunning ? '● Laskee aikaa' : '○ Pysäytetty'}
                </div>
              </div>
            </div>

            {/* Status + Agent */}
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
                    value={selected.agent || ''}
                    onChange={e => updateAgent(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">— Ei agenttia —</option>
                    {agents.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer info */}
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
                  <p className="text-blue-400">{selected.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Puhelin</p>
                  <p className="text-gray-200">{selected.phone}</p>
                </div>
              </div>
            </div>

            {/* Problem description */}
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Ongelma</p>
              <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
            </div>

            {/* AI suggestion */}
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/5 border-b border-[#21262d]">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-sm font-medium text-blue-400">AI-ehdotus</span>
                <span className="text-xs text-gray-500 ml-auto">Tarkista ennen lähetystä</span>
              </div>
              <div className="p-4">
                {editing ? (
                  <textarea
                    value={editedSuggestion}
                    onChange={e => setEditedSuggestion(e.target.value)}
                    rows={8}
                    className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono"
                  />
                ) : (
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{editedSuggestion}</p>
                )}
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#30363d] text-gray-400 hover:text-white hover:border-[#484f58] rounded-lg text-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  {editing ? 'Valmis' : 'Muokkaa'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Lähetä vastaus asiakkaalle
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}