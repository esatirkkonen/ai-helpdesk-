'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'

type Role = 'customer' | 'agent' | 'admin'

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  company: string
  company_id: string
  active: boolean
  created_at: string
}

type Company = {
  id: string
  name: string
  contact_email: string
  phone: string
  user_count: number
  created_at: string
}

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
type Modal = 'addUser' | 'addCompany' | 'editUser' | 'resetPassword' | 'deleteUser' | 'deleteCompany' | null

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Modal>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'Kaikki'>('Kaikki')
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Add user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<Role>('customer')
  const [newCompanyId, setNewCompanyId] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Edit user form
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<Role>('customer')
  const [editCompanyId, setEditCompanyId] = useState('')

  // Add company form
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyEmail, setNewCompanyEmail] = useState('')
  const [newCompanyPhone, setNewCompanyPhone] = useState('')

  // Reset password
  const [newPasswordReset, setNewPasswordReset] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    const n = localStorage.getItem('name')
    setToken(t)
    setName(n)
  }, [])

  useEffect(() => {
    if (token === null) return
    if (!token) { router.push('/login'); return }
    fetchUsers()
    fetchCompanies()
  }, [token])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/users?token=${token}`)
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompanies() {
    const res = await fetch(`http://localhost:8000/companies?token=${token}`)
    const data = await res.json()
    setCompanies(data)
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`http://localhost:8000/users?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole, phone: newPhone, company_id: newCompanyId || null }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Virhe'); return }
      setSuccess('Käyttäjä lisätty!'); setModal(null); resetAddUserForm(); await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function editUser(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setError('')
    try {
      const res = await fetch(`http://localhost:8000/users/${selectedUser.id}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone, role: editRole, company_id: editCompanyId || null }),
      })
      if (!res.ok) { setError('Virhe päivityksessä'); return }
      setSuccess('Käyttäjä päivitetty!'); setModal(null); await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setError('')
    try {
      const res = await fetch(`http://localhost:8000/users/${selectedUser.id}/reset-password?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPasswordReset }),
      })
      if (!res.ok) { setError('Virhe salasanan vaihdossa'); return }
      setSuccess('Salasana vaihdettu!'); setModal(null); setNewPasswordReset('')
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function deleteUser() {
    if (!selectedUser) return
    try {
      await fetch(`http://localhost:8000/users/${selectedUser.id}?token=${token}`, { method: 'DELETE' })
      setSuccess('Käyttäjä poistettu!'); setModal(null); await fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function deleteCompany() {
    if (!selectedCompany) return
    try {
      await fetch(`http://localhost:8000/companies/${selectedCompany.id}?token=${token}`, { method: 'DELETE' })
      setSuccess('Yritys poistettu!'); setModal(null); await fetchCompanies()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function addCompany(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`http://localhost:8000/companies?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName, contact_email: newCompanyEmail, phone: newCompanyPhone }),
      })
      if (!res.ok) { setError('Virhe yrityksen luonnissa'); return }
      setSuccess('Yritys lisätty!'); setModal(null); resetCompanyForm(); await fetchCompanies()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Yhteysvirhe') }
  }

  async function toggleActive(userId: string) {
    await fetch(`http://localhost:8000/users/${userId}/active?token=${token}`, { method: 'PUT' })
    await fetchUsers()
  }

  function openEditUser(user: User) {
    setSelectedUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPhone(user.phone || '')
    setEditRole(user.role)
    setEditCompanyId(user.company_id || '')
    setError('')
    setModal('editUser')
  }

  function resetAddUserForm() {
    setNewName(''); setNewEmail(''); setNewPhone(''); setNewPassword(''); setNewRole('customer'); setNewCompanyId('')
  }

  function resetCompanyForm() {
    setNewCompanyName(''); setNewCompanyEmail(''); setNewCompanyPhone('')
  }

  function logout() { localStorage.clear(); router.push('/login') }
  function formatDate(iso: string) { return new Date(iso).toLocaleDateString('fi-FI') }

  const filteredUsers = (users || []).filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.company || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'Kaikki' || u.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Topbar */}
       <Topbar activePage="admin" />
        

      <div className="max-w-6xl mx-auto px-6 py-8">

        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400 text-sm">{success}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Käyttäjiä yhteensä', value: (users || []).length },
            { label: 'Asiakkaita', value: (users || []).filter(u => u.role === 'customer').length },
            { label: 'Agentteja', value: (users || []).filter(u => u.role === 'agent').length },
            { label: 'Yrityksiä', value: (companies || []).length },
          ].map(stat => (
            <div key={stat.label} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
              <div className="text-2xl font-medium">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#161b22] border border-[#21262d] rounded-lg p-1">
            {(['users', 'companies'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-[#0d1117] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {t === 'users' ? 'Käyttäjät' : 'Yritykset'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setError(''); setModal(tab === 'users' ? 'addUser' : 'addCompany') }}
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
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Hae nimellä, sähköpostilla tai yrityksellä..."
                  className="w-full bg-[#161b22] border border-[#21262d] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex gap-2">
                {(['Kaikki', 'customer', 'agent', 'admin'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRole(r)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-colors ${filterRole === r ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'border-[#21262d] text-gray-500 hover:border-[#30363d]'}`}>
                    {r === 'Kaikki' ? 'Kaikki' : roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              {loading ? (
                <div className="text-center text-gray-500 py-12">Ladataan...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#21262d]">
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Nimi</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sähköposti</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Puhelin</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Rooli</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Yritys</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Tila</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-[#21262d] last:border-0 hover:bg-[#1c2128] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-blue-400">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{user.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{user.company || '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(user.id)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${user.active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {user.active ? 'Aktiivinen' : 'Ei aktiivinen'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditUser(user)}
                              className="text-xs px-2 py-1 border border-[#30363d] text-gray-400 hover:text-white hover:border-[#484f58] rounded-md transition-colors">
                              Muokkaa
                            </button>
                            <button onClick={() => { setSelectedUser(user); setError(''); setModal('resetPassword') }}
                              className="text-xs px-2 py-1 border border-[#30363d] text-gray-400 hover:text-amber-400 hover:border-amber-500/40 rounded-md transition-colors">
                              Salasana
                            </button>
                            <button onClick={() => { setSelectedUser(user); setModal('deleteUser') }}
                              className="text-xs px-2 py-1 border border-[#30363d] text-gray-400 hover:text-red-400 hover:border-red-500/40 rounded-md transition-colors">
                              Poista
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Sähköposti</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Puhelin</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Käyttäjiä</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Luotu</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {(companies || []).map(company => (
                  <tr key={company.id} className="border-b border-[#21262d] last:border-0 hover:bg-[#1c2128] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{company.name}</td>
                    <td className="px-4 py-3 text-sm text-blue-400">{company.contact_email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{company.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{company.user_count}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(company.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedCompany(company); setModal('deleteCompany') }}
                        className="text-xs px-2 py-1 border border-[#30363d] text-gray-400 hover:text-red-400 hover:border-red-500/40 rounded-md transition-colors">
                        Poista
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add user */}
      {modal === 'addUser' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Lisää käyttäjä</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={addUser} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
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
                <label className="block text-xs text-gray-400 mb-1.5">Salasana</label>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} required type="password" placeholder="••••••••"
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
                <select value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">— Valitse yritys —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Lisää käyttäjä</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit user */}
      {modal === 'editUser' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Muokkaa käyttäjää</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={editUser} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nimi</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Sähköposti</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} required type="email"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Puhelin</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Rooli</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as Role)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="customer">Asiakas</option>
                  <option value="agent">Agentti</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Yritys</label>
                <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">— Valitse yritys —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Tallenna</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset password */}
      {modal === 'resetPassword' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Vaihda salasana — {selectedUser.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={resetPassword} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Uusi salasana</label>
                <input value={newPasswordReset} onChange={e => setNewPasswordReset(e.target.value)} required type="password" placeholder="••••••••"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Vaihda salasana</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete user */}
      {modal === 'deleteUser' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-sm">
            <div className="p-6">
              <h2 className="font-medium text-red-400 mb-2">Poista käyttäjä</h2>
              <p className="text-sm text-gray-400 mb-6">Haluatko varmasti poistaa käyttäjän <strong className="text-white">{selectedUser.name}</strong>? Tätä ei voi peruuttaa.</p>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button onClick={deleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Poista</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete company */}
      {modal === 'deleteCompany' && selectedCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-sm">
            <div className="p-6">
              <h2 className="font-medium text-red-400 mb-2">Poista yritys</h2>
              <p className="text-sm text-gray-400 mb-6">Haluatko varmasti poistaa yrityksen <strong className="text-white">{selectedCompany.name}</strong>?</p>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button onClick={deleteCompany}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Poista</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add company */}
      {modal === 'addCompany' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
              <h2 className="font-medium">Lisää yritys</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={addCompany} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Yrityksen nimi</label>
                <input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} required placeholder="Yritys Oy"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Sähköposti</label>
                <input value={newCompanyEmail} onChange={e => setNewCompanyEmail(e.target.value)} type="email" placeholder="it@yritys.fi"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Puhelin</label>
                <input value={newCompanyPhone} onChange={e => setNewCompanyPhone(e.target.value)} placeholder="+358 9 123 4567"
                  className="w-full bg-[#0d1117] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-[#30363d] text-gray-400 hover:text-white rounded-lg py-2.5 text-sm transition-colors">Peruuta</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">Lisää yritys</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
