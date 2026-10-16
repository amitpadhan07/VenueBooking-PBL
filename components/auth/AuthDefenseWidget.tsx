'use client'

import { useState } from 'react'
import { KeyRound, Shield, CheckCircle2, Lock, Copy, Check } from 'lucide-react'

export default function AuthDefenseWidget({ currentRole, currentName }: { currentRole: string; currentName: string }) {
  const [copied, setCopied] = useState(false)

  // Sample token payload reflecting the active role
  const samplePayload = {
    userId: currentRole === 'Admin'
      ? '95a8d1e1-596d-4b3b-9292-admin-uuid'
      : currentRole === 'Employee'
      ? '88b7c2f2-495c-3a2a-8181-emp-uuid'
      : '77a6b1e1-384b-2919-7070-student-uuid',
    email: currentRole === 'Admin'
      ? 'admin@college.edu'
      : currentRole === 'Employee'
      ? 'emp_auditorium@college.edu'
      : 'student1@college.edu',
    role: currentRole.toUpperCase(),
    name: currentName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  }

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <h3 className="font-semibold text-sm">Akshat Defense: JWT Authentication & Password Security</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary font-mono">
          HMAC SHA-256
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Bcrypt Cryptography Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <Lock className="size-3.5" />
            <span>Bcrypt Hashing (Work Factor: 10)</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Passwords are never stored in plaintext. Seeded with <strong>10 salt rounds</strong> to defeat GPU rainbow-table attacks.
          </p>
          <div className="rounded bg-background p-2 font-mono text-[10px] text-muted-foreground border border-border overflow-x-auto">
            {"$2a$10$wKx5E... | hash = bcrypt(pass, salt)"}
          </div>
        </div>

        {/* Stateless JWT Payload Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <Shield className="size-3.5" />
              <span>Decoded JWT Session Token</span>
            </div>
            <button
              onClick={copyPayload}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="rounded bg-background p-2 font-mono text-[10px] text-muted-foreground border border-border overflow-x-auto">
            {JSON.stringify(samplePayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
