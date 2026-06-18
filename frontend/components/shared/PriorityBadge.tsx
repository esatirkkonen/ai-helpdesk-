type Priority = 'Matala' | 'Normaali' | 'Kiireellinen'

const priorityColors: Record<Priority, string> = {
  'Matala':       'text-green-400',
  'Normaali':     'text-blue-400',
  'Kiireellinen': 'text-red-400',
}

type Props = {
  priority: Priority
}

export default function PriorityBadge({ priority }: Props) {
  return (
    <span className={`text-xs font-medium ${priorityColors[priority]}`}>
      {priority}
    </span>
  )
}

