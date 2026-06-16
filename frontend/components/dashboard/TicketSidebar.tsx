'use client'
import type { Ticket, Status } from '@/types'

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

type Props = {
  tickets: Ticket[]
  selected: Ticket | null
  loading: boolean
  filter: 'all' | 'mine'
  name: string | null
  timers: Record<string, number>
  running: Record<string, boolean>
  onSelect: (ticket: Ticket) => void
  onFilterChange: (filter: 'all' | 'mine') => void
  onNewTicket: () => void
  openCount: number
  myCount: number
}

export default function TicketSidebar({
  tickets, selected, loading, filter, name,
  timers, running, onSelect, onFilterChange,
  onNewTicket, openCount, myCount
}: Props) {
  return (
    <div className="w-72 border-r border-[#21262d] bg-[#161b22] flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-[#21262d]">
        <div className="flex gap-3 text-xs mb-3">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-lg flex-1 text-center">
            <div className="font-medium text-lg">{openCount}</div>
            <div>Uudet</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-2 rounded-lg flex-1 text-center">
            <div className="font-medium text-lg">{myCount}</div>
            <div>Minulla</div>
          </div>
        </div>

        <button
          onClick={onNewTicket}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-medium transition-colors mb-3"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Uusi tiketti
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              filter === 'all'
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'border-[#30363d] text-gray-500 hover:border-[#484f58]'
            }`}
          >
            Kaikki
          </button>
          <button
            onClick={() => onFilterChange('mine')}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              filter === 'mine'
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'border-[#30363d] text-gray-500 hover:border-[#484f58]'
            }`}
          >
            Omat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-8 text-sm">Ladataan...</div>
        ) : tickets.filter(t => filter === 'all' || t.agent === name).length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">Ei tikettejä</div>
        ) : (
          tickets
            .filter(t => filter === 'all' || t.agent === name)
            .map(ticket => (
              <div
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className={`p-4 border-b border-[#21262d] cursor-pointer transition-colors ${
                  selected?.id === ticket.id
                    ? 'bg-blue-500/5 border-l-2 border-l-blue-500 pl-3.5'
                    : 'hover:bg-[#1c2128]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={ticket.status} />
                  {running[ticket.id] && (
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                      {formatTime((timers[ticket.id] || 0) + ticket.time_spent_seconds)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium truncate mt-1">
  <span className="text-gray-600 font-mono text-xs mr-1">#{String(ticket.ticket_number).padStart(4, '0')}</span>
  {ticket.title}
</p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500">{ticket.customer}</p>
                  {ticket.ticket_type && <TypeBadge type={ticket.ticket_type} />}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}