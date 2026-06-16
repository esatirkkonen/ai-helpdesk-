type Comment = {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user_name: string
}

type Props = {
  comments: Comment[]
}

export default function CommentHistory({ comments }: Props) {
  if (comments.length === 0) return null

  return (
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
  )
}