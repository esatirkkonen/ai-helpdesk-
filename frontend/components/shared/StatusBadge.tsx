type Status = 'Uusi' | 'Luokiteltu' | 'Käsittelyssä' | 'Odottaa' | 'Ratkaistu' | 'Suljettu'

const statusColors: Record<Status, string> = {
  'Uusi':         'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Luokiteltu':   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Käsittelyssä': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Odottaa':      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Ratkaistu':    'bg-green-500/10 text-green-400 border-green-500/20',
  'Suljettu':     'bg-gray-500/10 text-gray-300 border-gray-500/20',
}

type Props = {
  status: Status
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full border ${statusColors[status]} ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
      {status}
    </span>
  )
}
