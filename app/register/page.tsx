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
  User,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'EMPLOYEE'>('STUDENT')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const campusDepartments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Management Studies (MBA)',
    'Student Affairs & Clubs',
    'Sports & Physical Education',
    'Campus Facilities & Operations',
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!name || !email || !password || !department) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          department,
          phone: phone.trim() || null,
          role,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok && data.success) {
        setSuccessMsg(`Account created successfully! Signing you in...`)
        await refreshUser()
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      } else {
        setError(data.error || 'Registration failed.')
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Network error during registration.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg space-y-6 relative z-10">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 mb-1">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Create Your Campus Account
            </h1>
            <p className="text-xs text-muted-foreground">
              Official Campus Facility & Resource Scheduling Portal
            </p>
          </div>

          {/* Form Card */}
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

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="name-input">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="email-input">
                  College Email Address <span className="text-red-500">*</span>
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

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Select Role / Account Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      role === 'STUDENT'
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 mb-1" />
                    <span className="text-[11px]">Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('FACULTY')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      role === 'FACULTY'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <Briefcase className="h-4 w-4 mb-1" />
                    <span className="text-[11px]">Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('EMPLOYEE')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      role === 'EMPLOYEE'
                        ? 'border-blue-500 bg-blue-50/40 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 mb-1" />
                    <span className="text-[11px]">Staff / Venue</span>
                  </button>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="department-select">
                  Department / Organization <span className="text-red-500">*</span>
                </label>
                <select
                  id="department-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {campusDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="phone-input">
                  Contact Phone Number <span className="text-muted-foreground text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="pass-input">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="pass-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      required
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="confirm-pass-input">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="confirm-pass-input"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-primary py-2.5 px-4 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>

          </div>

          {/* Database Verification note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Official Campus Portal · Verified Access</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
