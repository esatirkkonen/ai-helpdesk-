type Props = {
  customer: string
  company: string
  email: string
  phone: string
}

export default function CustomerInfo({ customer, company, email, phone }: Props) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-3">Asiakkaan tiedot</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Nimi</p>
          <p className="text-gray-200">{customer}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Yritys</p>
          <p className="text-gray-200">{company}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Sähköposti</p>
          <p className="text-blue-400">{email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Puhelin</p>
          <p className="text-gray-200">{phone || '—'}</p>
        </div>
      </div>
    </div>
  )
}

