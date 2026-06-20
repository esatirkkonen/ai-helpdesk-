'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { API_URL } from '@/lib/api'

type Ticket = {
  id: string
  title: string
  status: 'Avoin' | 'Työn alla' | 'Odottaa' | 'Valmis' | 'Keskeytetty'
  created_at: string
  updated_at: string
}

type Comment = {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user_name: string
}

const statusColors: Record<Ticket['status'], string> = {
  'Avoin':       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Työn alla':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Odottaa':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Valmis':      'bg-green-500/10 text-green-400 border-green-500/20',
  'Keskeytetty': 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function CustomerPage() {
  const router = useRouter()
  const [view, setView] = useState<'tickets' | 'new'>('tickets')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Matala' | 'Normaali' | 'Kiireellinen'>('Normaali')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
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
      const res = await fetch(`${API_URL}/tickets?token=${token}`)
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setTickets(data)
    } catch {
      setError('Virhe ladattaessa tikettejä')
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments(ticketId: string) {
    setLoadingComments(true)
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}/comments?token=${token}`)
      const data = await res.json()
      setComments(data.filter((c: Comment) => !c.is_internal))
    } finally {
      setLoadingComments(false)
    }
  }

  async function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    setComments([])
    await fetchComments(ticket.id)
  }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  console.log('Token:', token)
  console.log('Title:', title)
  setSubmitting(true)
  setError('')
    try {
      const res = await fetch(`${API_URL}/tickets?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority }),
      })
      if (!res.ok) throw new Error('Virhe tiketin luonnissa')
      setSuccess(true)
      setTitle('')
      setDescription('')
      setPriority('Normaali')
      await fetchTickets()
      setTimeout(() => {
        setSuccess(false)
        setView('tickets')
      }, 1500)
    } catch {
      setError('Virhe tiketin luonnissa — yritä uudelleen')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fi-FI')
  }

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Topbar */}
      

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Topbar activePage="customer" />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium">Omat tiketit</h1>
            <p className="text-gray-500 text-sm mt-1">Seuraa IT-tukipyyntöjesi etenemistä</p>
          </div>
          <button
            onClick={() => { setView(view === 'new' ? 'tickets' : 'new'); setSelectedTicket(null) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={view === 'new' ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
            </svg>
            {view === 'new' ? 'Peruuta' : 'Uusi tiketti'}
          </button>
        </div>

        {/* Uusi tiketti -lomake */}
        {view === 'new' && (
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 mb-8">
            <h2 className="font-medium mb-6">Uusi tukipyyntö</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Otsikko</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Lyhyt kuvaus ongelmasta"
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Kuvaus</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Kuvaile ongelma tarkemmin..."
                  required
                  rows={4}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Prioriteetti</label>
                <div className="flex gap-2">
                  {(['Matala', 'Normaali', 'Kiireellinen'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        priority === p
                          ? p === 'Kiireellinen'
                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                            : p === 'Normaali'
                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                            : 'bg-green-500/10 border-green-500/40 text-green-400'
                          : 'bg-transparent border-[#30363d] text-gray-500 hover:border-[#484f58]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || success}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  success
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white'
                }`}
              >
                {success ? '✓ Tiketti lähetetty!' : submitting ? 'Lähetetään...' : 'Lähetä tukipyyntö'}
              </button>
            </form>
          </div>
        )}

        {/* Tikettilista */}
        {view === 'tickets' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 py-12">Ladataan tikettejä...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="mb-4">Sinulla ei ole vielä tikettejä</p>
                <button
                  onClick={() => setView('new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Luo ensimmäinen tiketti
                </button>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`bg-[#161b22] border rounded-xl px-6 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : 'border-[#21262d] hover:border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-xs font-mono">{ticket.id.slice(0,8)}...</span>
                    <div>
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Luotu {formatDate(ticket.created_at)} · Päivitetty {formatDate(ticket.updated_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
              ))
            )}

            {/* Kommenttihistoria */}
            {selectedTicket && (
              <div className="mt-4 bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#21262d] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{selectedTicket.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Tiketin historia</p>
                  </div>
                  <button
                    onClick={() => { setSelectedTicket(null); setComments([]) }}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loadingComments ? (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm">Ladataan...</div>
                ) : comments.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm">
                    Ei viestejä vielä — IT-tuki vastaa pian
                  </div>
                ) : (
                  <div className="divide-y divide-[#21262d]">
                    {comments.map(comment => (
                      <div key={comment.id} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-400">{comment.user_name || 'IT-tuki'}</span>
                          <span className="text-xs text-gray-600">
                            {new Date(comment.created_at).toLocaleString('fi-FI')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

