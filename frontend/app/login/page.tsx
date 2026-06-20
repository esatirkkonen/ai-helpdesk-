'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
     const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Väärä sähköposti tai salasana')
        return
      }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      localStorage.setItem('email', data.email)
      localStorage.setItem('id', data.id)

      if (data.role === 'admin') router.push('/admin')
      else if (data.role === 'agent') router.push('/dashboard')
      else router.push('/customer')

    } catch {
      setError('Yhteysvirhe — tarkista että backend on käynnissä')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-medium tracking-tight">CloudwebAI Helpdesk</h1>
          <p className="text-gray-500 text-sm mt-1">Kirjaudu sisään jatkaaksesi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Sähköposti</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nimi@yritys.fi"
              required
              className="w-full bg-[#161b22] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Salasana</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#161b22] border border-[#30363d] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
        </form>

        {/* Test credentials */}
        <div className="mt-8 bg-[#161b22] border border-[#21262d] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-3 font-medium">Testitunnukset:</p>
          <div className="space-y-2">
            {[
              { role: 'Admin', email: 'admin@cloudwebai.fi' },
              { role: 'Agentti', email: 'matti@cloudwebai.fi' },
              { role: 'Asiakas', email: 'jukka@acme.fi' },
            ].map(u => (
              <button
                key={u.email}
                onClick={() => { setEmail(u.email); setPassword('admin123') }}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#21262d] transition-colors"
              >
                <span className="text-xs text-gray-400">{u.role}</span>
                <span className="text-xs text-gray-600">{u.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          CloudwebAI Helpdesk — AI-avusteinen tukipalvelu
        </p>
      </div>
    </div>
  )
}

