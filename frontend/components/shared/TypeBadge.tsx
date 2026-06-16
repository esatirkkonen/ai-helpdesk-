const typeColors: Record<string, string> = {
  'Incident':        'bg-red-500/10 text-red-400 border-red-500/20',
  'Service Request': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Problem':         'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Change':          'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

type Props = {
  type: string
}

export default function TypeBadge({ type }: Props) {
  if (!type) return null
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${typeColors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {type}
    </span>
  )
}