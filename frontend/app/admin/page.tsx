'use client'

import { useState } from 'react'

type Role = 'customer' | 'agent' | 'admin'

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  company: string
  created: string
  active: boolean
}

type Company = {
  id: string
  name: string
  contactEmail: string
  userCount: number
  created: string
}

const mockUsers: User[] = [
  { id: '1', name: 'Jukka Korhonen', email: 'jukka.korhonen@acme.fi', phone: '+358 40 123 4567', role: 'customer', company: 'Acme Oy', created: '1.1.2025', active: true },
  { id: '2', name: 'Sari Mäkinen', email: 'sari.makinen@beta.fi', phone: '+358 50 234 5678', role: 'customer', company: 'Beta Corp', created: '15.1.2025', active: true },
  { id: '3', name: 'Anna Lehtinen', email: 'anna.lehtinen@acme.fi', phone: '+358 45 345 6789', role: 'customer', company: 'Acme Oy', created: '20.1.2025', active: true },
  { id: '4', name: 'Matti Tukihenkilö', email: 'matti@cloudwebai.fi', phone: '+358 40 111 2222', role: 'agent', company: 'CloudwebAI', created: '1.1.2025', active: true },
  { id: '5', name: 'Tiina Agentti', email: 'tiina@cloudwebai.fi', phone: '+358 50 333 4444', role: 'agent', company: 'CloudwebAI', created: '1.1.2025', active: true },
  { id: '6', name: 'Admin Käyttäjä', email: 'admin@cloudwebai.fi', phone: '+358 40 999 0000', role: 'admin', company: 'CloudwebAI', created: '1.1.2025', active: true },
]

const mockCompanies: Company[] = [
  { id: '1', name: 'Acme Oy', contactEmail: 'it@acme.fi', userCount: 2, created: '1.1.2025' },
  { id: '2', name: 'Beta Corp', contactEmail: 'support@beta.fi', userCount: 1, created: '15.1.2025' },
  { id: '3', name: 'Gamma Ltd', contactEmail: 'info@gamma.fi', userCount: 1, created: '20.1.2025' },
]

const roleColors: Record<Role, string> = {
  customer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  agent:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  admin:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const roleLabels: Record<Role, string> = {
  customer: 'Asiakas',
  agent:    'Agentti',
  admin:    'Admin',
}

type Tab = 'users' | 'companies'
type Modal = 'user' | 'company' | null

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)
  const [modal, setModal] = useState<Modal>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'Kaikki'>('Kaikki')

  // New user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<Role>('customer')
  const [newCompany, setNewCompany] = useState('')

  // New company form
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyEmail, setNewCompanyEmail] = useState('')

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'Kaikki' || u.role === filterRole
    return matchSearch && matchRole
  })

  function addUser(e: React.FormEvent) {
    e.preventDefault()
    const user: User = {
      id: String(users.length + 1),
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      company: newCompany,
      created: new Date().toLocaleDateString('fi-FI'),
      active: true,
    }
    setUsers([...users, user])
    setModal(null)
    setNewName(''); setNewEmail(''); setNewPhone(''); setNewCompany('')
  }

  function addCompany(e: React.FormEvent) {
    e.preventDefault()
    const company: Company = {
      id: String(companies.length + 1),
      name: newCompanyName,
      contactEmail: newCompanyEmail,
      userCount: 0,
      created: new Date().toLocaleDateString('fi-FI'),
    }
    setCompanies([...companies, company])
    setModal(null)
    setNewCompanyName(''); setNewCompanyEmail('')
  }

  function toggleActive(id: string) {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Topbar */}
      <div className="border-b border-[#21262d] bg-[#161b22]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-sm">CloudwebAI Helpdesk</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/tickets" className="text-gray-500 hover:text-gray-300 transition-colors">Tiketit</a>
            <a href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">Dashboard</a>
            <a href="/admin" className="text-white font-medium">Admin</a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Admin Käyttäjä</span>
            <button className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Kirjaudu ulos</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Käyttäjiä yhteensä', value: users.length, color: 'text-white' },
            { label: 'Asiakkaita', value: users.filter(u => u.role === 'customer').length, color: 'text-gray-400' },
            { label: 'Agentteja', value: users.filter(u => u.role === 'agent').length, color: 'text-blue-400' },
            { label: 'Yrityksiä', value: companies.length, color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
              <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#161b22] border border-[#21262d] rounded-lg p-1">
            {(['users', 'companies'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-[#0d1117] text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'users' ? 'Käyttäjät' : 'Yritykset'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModal(tab === 'users' ? 'user' : 'company')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {tab === 'users' ? 'Lisää käyttäjä' : 'Lisää yritys'}
          </button>
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Hae nimellä, sähköpostilla tai yrityksellä..."
                  className="w-full bg-[#161b22] border border-[#21262d] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {(['Kaikki', 'customer', 'agent', 'admin'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                      filterRole === r
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                        : 'border-[#21262d] text-gray-500 hover:border-[#30363d]'
                    }`}
                  >
                    {r === 'Kaikki' ? 'Kaikki' : roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Nimi</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sähköposti</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Puhelin</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Rooli</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Yritys</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Luotu</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Tila</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-[#21262d] last:border-0 hover:bg-[#1c2128] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-blue-400">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{user.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{user.company}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{user.created}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(user.id)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            user.active
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                          }`}
                        >
                          {user.active ? 'Aktiivinen' : 'Poistettu'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Companies tab */}
        {tab === 'companies' && (
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#21262d]">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Yritys</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Yhteyshenkilön sähköposti</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Käyttäjiä</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Luotu</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} className="border-b border-[#21262d] last:border-0 hover:bg-[#1c2128] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{company.name}</td>
                    <td className="px-4 py-3 text-sm text-blue-400">{company.contactEmail}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{company.userCount}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{company.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add user */}
      {modal === 'user' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Lisää käyttäjä</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={addUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nimi</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Etunimi Sukunimi"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Sähköposti</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} required type="email" placeholder="nimi@yritys.fi"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Puhelin</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+358 40 123 4567"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Rooli</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as Role)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="customer">Asiakas</option>
                  <option value="agent">Agentti</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Yritys</label>
                <select value={newCompany} onChange={e => setNewCompany(e.target.value)} required
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">— Valitse yritys —</option>
                  {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">
                  Peruuta
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                  Lisää käyttäjä
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add company */}
      {modal === 'company' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Lisää yritys</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={addCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Yrityksen nimi</label>
                <input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} required placeholder="Yritys Oy"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Yhteyshenkilön sähköposti</label>
                <input value={newCompanyEmail} onChange={e => setNewCompanyEmail(e.target.value)} required type="email" placeholder="it@yritys.fi"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">
                  Peruuta
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                  Lisää yritys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}