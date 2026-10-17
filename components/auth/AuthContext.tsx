'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface UserProfile {
  userId: string
  name: string
  email: string
  role: 'STUDENT' | 'FACULTY' | 'EMPLOYEE' | 'ADMIN'
  department: string
  phone?: string | null
  employee?: {
    employeeId: string
    employeeCode: string
    designation: string
    authorizedVenues?: Array<{
      authorityId: string
      venueId: string
      venueName: string
      capacity: number
      location: string
    }>
  } | null
}

interface AuthContextType {
  user: UserProfile | null
  role: 'STUDENT' | 'FACULTY' | 'EMPLOYEE' | 'ADMIN' | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          return
        }
      }
      setUser(null)
    } catch (err) {
      console.error('Failed to fetch auth session:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUser(data.user)
        return { success: true, user: data.user }
      }
      return { success: false, error: data.error || 'Login failed.' }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Error logging out:', err)
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
