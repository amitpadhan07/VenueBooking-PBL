'use client'

import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DBMSAcademicLab from '@/components/dbms/DBMSAcademicLab'
import { Database, Terminal, ShieldCheck, Layers } from 'lucide-react'

export default function DBMSLabPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Lab Header */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Academic Concept Lab
                </span>
                <span className="text-xs text-muted-foreground font-mono">PBL Domain: Database Management Systems</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                <Database className="h-7 w-7 text-primary" />
                DBMS Academic Lab & SQL Playground
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Inspect the 8-table 3NF normalized PostgreSQL schema, run live Relational Algebra INNER JOIN queries,
                test pessimistic row-locking (`SELECT ... FOR UPDATE`), and explore ACID transaction lifecycle guarantees.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Database</span>
                <span className="font-bold text-foreground">PostgreSQL 16</span>
              </div>
              <div className="rounded-xl border border-border bg-emerald-500/10 px-3 py-2 text-center border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold tracking-wider">DBMS Defense</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">15/15 Passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Component */}
        <DBMSAcademicLab />
      </main>

      <Footer />
    </div>
  )
}

