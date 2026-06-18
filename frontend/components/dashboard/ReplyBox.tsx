type Props = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  sending: boolean
}

export default function ReplyBox({ value, onChange, onSend, sending }: Props) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/5 border-b border-[#21262d]">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <span className="text-sm font-medium text-blue-400">Vastaus asiakkaalle</span>
      </div>
      <div className="p-4">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={5}
          placeholder="Kirjoita vastaus asiakkaalle..."
          className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          {sending ? 'Lähetetään...' : 'Lähetä vastaus asiakkaalle'}
        </button>
      </div>
    </div>
  )
}

