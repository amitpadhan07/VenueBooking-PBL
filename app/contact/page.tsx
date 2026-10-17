'use client'

import React, { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [category, setCategory] = useState('General Facility Inquiry')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!name || !email || !message) {
      setError('Please provide your name, college email, and message.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department,
          subject: subject.trim() || category,
          message: message.trim(),
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Inquiry submitted successfully.')
        setName('')
        setEmail('')
        setSubject('')
        setMessage('')
      } else {
        setError(data.error || 'Failed to submit inquiry.')
      }
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Network error while sending message.')
    }
  }

  const faqs = [
    {
      q: 'How fast are venue booking requests reviewed?',
      a: 'Requests are routed automatically to designated departmental venue authorities based on the venue authority matrix and are typically resolved within 2 to 4 business hours.',
    },
    {
      q: 'How does the platform ensure no two events get booked simultaneously?',
      a: 'The system uses PostgreSQL row-level pessimistic locks (SELECT ... FOR UPDATE) during booking commits. If a mathematical interval overlap is detected, the transaction safely rolls back.',
    },
    {
      q: 'Can students book venues directly without faculty endorsement?',
      a: 'Students can initiate venue requests anytime. The request will automatically appear in the departmental venue approver inbox with status PENDING until authorized.',
    },
    {
      q: 'What should I do if an emergency room lock or AV issue occurs?',
      a: 'Contact the Campus Facilities Operations Emergency Desk at Ext. 204 or email venues-emergency@college.edu for immediate on-site technician dispatch.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MessageSquare className="h-3.5 w-3.5" />
              Campus Facilities & System Administration
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Get in Touch with Facilities Operations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Have questions regarding venue allocation, AV equipment, booking approvals, or technical system access? Our team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Submit an Inquiry or Request</h2>
                <p className="text-xs text-muted-foreground">
                  Messages are logged with non-repudiation audit tracking in the campus database.
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="contact-name">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kumar"
                      required
                      className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="contact-email">
                      College Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@college.edu"
                      required
                      className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="contact-dept">
                      Department / Organization
                    </label>
                    <select
                      id="contact-dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Student Affairs & Clubs">Student Affairs & Clubs</option>
                      <option value="Campus Facilities & Operations">Campus Facilities & Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="contact-category">
                      Inquiry Category
                    </label>
                    <select
                      id="contact-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="General Facility Inquiry">General Facility Inquiry</option>
                      <option value="Technical System Issue">Technical System Issue</option>
                      <option value="Booking Approval Escalation">Booking Approval Escalation</option>
                      <option value="Special AV Equipment Request">Special AV Equipment Request</option>
                      <option value="Admin Access & Roles">Admin Access & Roles</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="contact-subject">
                    Subject Line
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief subject of your inquiry"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="contact-message">
                    Message Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, affected venue, date, or event details..."
                    required
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary py-2.5 px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message to Administration
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Campus Info & Emergency Card */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Facilities Operations Center
                </h3>

                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Campus Location</strong>
                      <span>Academic Block 3, Ground Floor, Suite 102, North Campus</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Operating Hours</strong>
                      <span>Monday to Saturday: 8:00 AM – 6:30 PM</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Email Helpdesk</strong>
                      <span className="font-mono text-primary">venues@college.edu</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Direct Helpline</strong>
                      <span>+91 (080) 2844-9000 (Ext. 204)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Box */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <span>Immediate Event Support</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  For ongoing live events in the Main Auditorium or Seminar Halls experiencing audio/visual or power lockouts, radio the Duty Engineer at <strong>Ext. 991</strong>.
                </p>
              </div>
            </div>

          </div>

          {/* FAQ Accordion Section */}
          <div className="border-t border-border pt-12 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Quick answers regarding campus reservations, policies, and approvals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
