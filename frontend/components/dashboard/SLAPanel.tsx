type Props = {
  firstResponseDeadline: string | null
  resolutionDeadline: string | null
  slaBreached: boolean
}

function getSLAStatus(deadline: string | null) {
  if (!deadline) return { percent: 0, color: '', label: '' }
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return { percent: 100, color: 'bg-red-500', label: 'SLA rikottu!' }
  const percent = Math.min(100, Math.max(0, ((1 - diff / (24 * 60 * 60 * 1000)) * 100)))
  if (percent >= 90) return { percent, color: 'bg-red-500', label: `${Math.floor(diff / 60000)} min jäljellä` }
  if (percent >= 75) return { percent, color: 'bg-amber-500', label: `${Math.floor(diff / 3600000)}h jäljellä` }
  return { percent, color: 'bg-green-500', label: `${Math.floor(diff / 3600000)}h jäljellä` }
}

export default function SLAPanel({ firstResponseDeadline, resolutionDeadline, slaBreached }: Props) {
  if (!firstResponseDeadline && !resolutionDeadline) return null

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-3">SLA-seuranta</p>
      <div className="space-y-3">
        {firstResponseDeadline && (() => {
          const sla = getSLAStatus(firstResponseDeadline)
          return (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Ensivastaus</span>
                <span className={`text-xs font-medium ${sla.color === 'bg-red-500' ? 'text-red-400' : sla.color === 'bg-amber-500' ? 'text-amber-400' : 'text-green-400'}`}>
                  {sla.label}
                </span>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${sla.color}`} style={{ width: `${sla.percent}%` }} />
              </div>
            </div>
          )
        })()}
        {resolutionDeadline && (() => {
          const sla = getSLAStatus(resolutionDeadline)
          return (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Ratkaisu</span>
                <span className={`text-xs font-medium ${sla.color === 'bg-red-500' ? 'text-red-400' : sla.color === 'bg-amber-500' ? 'text-amber-400' : 'text-green-400'}`}>
                  {sla.label}
                </span>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${sla.color}`} style={{ width: `${sla.percent}%` }} />
              </div>
            </div>
          )
        })()}
        {slaBreached && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs font-medium">
            ⚠️ SLA rikottu!
          </div>
        )}
      </div>
    </div>
  )
}
