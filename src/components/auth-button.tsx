"use client"

import { useEffect, useState } from 'react'

interface SessionData {
  sub: string;
  email?: string;
  name?: string;
}

export default function AuthButton() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/session-check')
      .then(res => res.json())
      .then(data => {
        setSession(data.authenticated ? data : null)
        setLoading(false)
      })
      .catch(() => {
        setSession(null)
        setLoading(false)
      })
  }, [])

  const handleLogin = () => {
    window.location.assign('/api/auth/login');
  };

  const handleLogout = () => {
    window.location.assign('/api/auth/logout');
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p>Signed in as {session.email}</p>
        <button 
          onClick={handleLogout}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={handleLogin}
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-10 px-4"
    >
      Sign in with Auth0
    </button>
  )
}