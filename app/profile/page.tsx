'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  User,
  Shield,
  KeyRound,
  History,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react'

interface AuditLogItem {
  logId: string
  action: string
  entityType: string
  entityId: string
  details: any
  userName: string
  userEmail: string
  userRole: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Fetch recent user activity
  const fetchUserLogs = useCallback(async () => {
    if (!user?.userId) return
    try {
      setLoadingLogs(true)
      const res = await fetch(`/api/audit-logs?userId=${user.userId}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch recent audit activity:', err)
    } finally {
      setLoadingLogs(false)
    }
  }, [user?.userId])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.userId) {
      fetchUserLogs()
    }
  }, [authLoading, isAuthenticated, user?.userId, router, fetchUserLogs])

  // Handle Change Password Form Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.')
      return
    }

    try {
      setSubmittingPassword(true)
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      setSubmittingPassword(false)

      if (res.ok && data.success) {
        setPasswordSuccess(data.message || 'Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Refresh audit logs to show PASSWORD_CHANGED action
        fetchUserLogs()
      } else {
        setPasswordError(data.error || 'Failed to update password.')
      }
    } catch (err: any) {
      setSubmittingPassword(false)
      setPasswordError(err?.message || 'Network error while updating password.')
    }
  }

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
      case 'EMPLOYEE':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
      case 'FACULTY':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
    }
  }

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('PASSWORD')) {
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
    }
    if (action.includes('APPROVED')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
    }
    if (action.includes('REJECTED') || action.includes('DENIED') || action.includes('UNAUTHORIZED')) {
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
    }
    if (action.includes('LOGIN')) {
      return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
    }
    return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
  }

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading user profile & security settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          
          {/* Page Header */}
          <div className="border-b border-border pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>User Profile & Security Management</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Account & Security Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage your personal campus credentials, view RBAC privileges, and securely rotate your access key.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: User Card & Privilege Summary */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-2xl shadow-lg shadow-primary/20">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-foreground">{user?.name}</h2>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  
                  <div className="mt-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                      <Shield className="h-3.5 w-3.5" />
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-primary" /> Department
                    </span>
                    <span className="font-semibold text-foreground">{user?.department || 'General'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Phone
                    </span>
                    <span className="font-semibold text-foreground">{user?.phone || 'Not Registered'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Campus Mail
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[140px]">{user?.email}</span>
                  </div>

                  {user?.employee && (
                    <>
                      <div className="border-t border-dashed border-border my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <IdCard className="h-3.5 w-3.5 text-blue-600" /> Employee Code
                        </span>
                        <span className="font-mono font-bold text-foreground">{user.employee.employeeCode}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-blue-600" /> Designation
                        </span>
                        <span className="font-semibold text-foreground">{user.employee.designation}</span>
                      </div>

                      {user.employee.authorizedVenues && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Authorized Venues
                          </span>
                          <span className="font-bold text-emerald-600">{user.employee.authorizedVenues.length} Facilities</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Security Status Box */}
                <div className="rounded-xl bg-muted/40 p-3.5 border border-border text-[11px] space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Cryptographic Protection</span>
                  </div>
                  <p>Passwords stored with 10 salt rounds bcrypt hashing with rainbow-table resistance.</p>
                </div>
              </div>

            </div>

            {/* Right Column: Change Password & Security Activity */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Change Password Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Change Password</h3>
                      <p className="text-xs text-muted-foreground">Update your authentication secret with instant audit logging</p>
                    </div>
                  </div>
                </div>

                {/* Success Alert */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold">{passwordSuccess}</p>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {passwordError && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3.5 text-xs text-red-800 dark:text-red-300 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-semibold">{passwordError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your existing password"
                        required
                        className="w-full rounded-xl border border-border bg-background py-2 pl-3 pr-10 text-xs outline-none focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                          className="w-full rounded-xl border border-border bg-background py-2 pl-3 pr-10 text-xs outline-none focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          className="w-full rounded-xl border border-border bg-background py-2 pl-3 pr-10 text-xs outline-none focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Requirements Hint */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Security Requirements:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Minimum 6 characters in length</li>
                      <li>Must be different from your current password</li>
                      <li>Encrypted via bcrypt with 10 work factor salt rounds</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingPassword}
                      className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {submittingPassword ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Recent Activity / Audit Logs */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Recent Security Activity</h3>
                      <p className="text-xs text-muted-foreground">Immutable audit logs recorded for your campus account</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchUserLogs}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                    Loading recent audit trail...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
                    <p className="font-semibold text-foreground">No Activity Logs Found</p>
                    <p>Actions performed by your account will be immutably recorded in the audit trail.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div key={log.logId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeStyle(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground font-mono">
                              {log.entityType}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {typeof log.details === 'object'
                                ? JSON.stringify(log.details)
                                : String(log.details)}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 font-mono shrink-0">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
