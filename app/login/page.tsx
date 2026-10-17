'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success && result.user) {
      setSuccessMsg(`Welcome back, ${result.user.name}! Redirecting to your workspace...`)
      setTimeout(() => {
        if (result.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }, 700)
    } else {
      setError(result.error || 'Invalid credentials or user not found.')
    }
  }

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 mb-1">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sign in to VenueDesk
            </h1>
            <p className="text-xs text-muted-foreground">
              Campus Venue Allocation & Resource Operations System
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-border bg-card/95 p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-5">
            
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <p>{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="email-input">
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    required
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground" htmlFor="password-input">
                    Password
                  </label>
                  <span className="text-[11px] text-muted-foreground">Encrypted & Protected</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password view"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins Section */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                One-Click Role Demonstration
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('student1@college.edu', 'student123')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-muted/30 hover:border-emerald-500 hover:bg-emerald-50/20 text-center transition-all group"
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-foreground">Student</span>
                  <span className="text-[9px] text-muted-foreground">Regular User</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('emp_auditorium@college.edu', 'emp123')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-muted/30 hover:border-blue-500 hover:bg-blue-50/20 text-center transition-all group"
                >
                  <Briefcase className="h-4 w-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-foreground">Employee</span>
                  <span className="text-[9px] text-muted-foreground">Venue Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('admin@college.edu', 'admin123')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-muted/30 hover:border-purple-500 hover:bg-purple-50/20 text-center transition-all group"
                >
                  <ShieldCheck className="h-4 w-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-foreground">Admin</span>
                  <span className="text-[9px] text-muted-foreground">Full Access</span>
                </button>
              </div>
            </div>

            {/* Registration Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don't have an account yet?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Create new account
                </Link>
              </p>
            </div>

          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>Official Campus Portal · Verified Access</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
