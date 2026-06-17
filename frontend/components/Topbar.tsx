'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type Props = {
  activePage: 'tickets' | 'dashboard' | 'admin' | 'customer'
}

export default function Topbar({ activePage }: Props) {
  const router = useRouter()
 const [role, setRole] = useState<string | null>(null)
const [name, setName] = useState<string | null>(null)

useEffect(() => {
  setRole(localStorage.getItem('role'))
  setName(localStorage.getItem('name'))
}, [])

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  return (
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
          {/* Asiakas */}
          {role === 'customer' && (
            <a href="/customer" className={activePage === 'customer' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300 transition-colors'}>
              Omat tiketit
            </a>
          )}

          {/* Agentti ja Admin */}
          {(role === 'agent' || role === 'admin') && (
            <>
              <a href="/tickets" className={activePage === 'tickets' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300 transition-colors'}>
                Tiketit
              </a>
              <a href="/dashboard" className={activePage === 'dashboard' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300 transition-colors'}>
                Dashboard
              </a>
            </>
          )}

          {/* Vain Admin */}
          {role === 'admin' && (
            <a href="/admin" className={activePage === 'admin' ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300 transition-colors'}>
              Admin
            </a>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {(role === 'agent' || role === 'admin') && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
          <span className="text-sm text-gray-400">{name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Kirjaudu ulos
          </button>
        </div>
      </div>
    </div>
  )
}
