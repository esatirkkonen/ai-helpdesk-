type Props = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

export default function InternalNote({ value, onChange, onSave }: Props) {
  return (
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
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          placeholder="Kirjoita sisäinen muistiinpano..."
          className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onSave}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Tallenna muistiinpano
        </button>
      </div>
    </div>
  )
}
