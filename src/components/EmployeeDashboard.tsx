'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { ProfileWithCompany } from '@/app/actions/profile'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Clock,
  Calendar,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  HelpCircle
} from 'lucide-react'

interface EmployeeDashboardProps {
  profile: ProfileWithCompany
  leaveBalances: {
    leave_type: string
    total_days: number
    used_days: number
  }[]
  recentClocks: {
    date: string
    check_in: string
    check_out: string | null
    status: string
  }[]
}

export default function EmployeeDashboard({ profile, leaveBalances, recentClocks }: EmployeeDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Handle logout
  const handleLogout = async () => {
    startTransition(async () => {
      const res = await signOut()
      if (res.success) {
        toast.success(res.message)
        router.push('/login')
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time helper
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Find leave balance values
  const paidLeave = leaveBalances.find(b => b.leave_type === 'Paid time off') || { total_days: 0, used_days: 0 }
  const sickLeave = leaveBalances.find(b => b.leave_type === 'Sick Leave') || { total_days: 0, used_days: 0 }

  return (
    <div className="space-y-8 font-sans">
      
      {/* WELCOME BANNER WITH GLASSMORPHISM AND GRADIENT */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-slate-900 bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-purple-950/10 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
              Dayflow Employee Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-100 mt-2">
              Hello, {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Welcome back to your employee portal. Check details, submit requests, and track your workdays.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900 shrink-0">
            <Briefcase className="w-8 h-8 text-indigo-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Department</span>
              <span className="text-xs font-bold text-slate-200 truncate">{profile.department || 'General'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS CARDS (GRID OF 4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Profile Card */}
        <Link href={`/dashboard/employees/${profile.id}`} className="group">
          <Card className="glass glass-hover h-full border-slate-900 rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <User className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-heading font-bold text-slate-100">My Profile</CardTitle>
              <CardDescription className="text-[11px] text-slate-450">
                View personal info, bank details, and resume details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-end text-xs text-indigo-400 font-semibold gap-1 pt-0">
              <span>View Profile</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        {/* Attendance Card */}
        <Link href="/dashboard/attendance" className="group">
          <Card className="glass glass-hover h-full border-slate-900 rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-heading font-bold text-slate-100">Attendance</CardTitle>
              <CardDescription className="text-[11px] text-slate-450">
                Log clock-ins/outs, check worked hours, and view history.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-end text-xs text-emerald-400 font-semibold gap-1 pt-0">
              <span>View Logs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        {/* Time Off Card */}
        <Link href="/dashboard/timeoff" className="group">
          <Card className="glass glass-hover h-full border-slate-900 rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-heading font-bold text-slate-100">Leave Requests</CardTitle>
              <CardDescription className="text-[11px] text-slate-450">
                Apply for leave, upload certificates, and check balances.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-end text-xs text-purple-400 font-semibold gap-1 pt-0">
              <span>Apply Leave</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        {/* Logout Card */}
        <button onClick={handleLogout} disabled={isPending} className="group text-left w-full cursor-pointer">
          <Card className="glass glass-hover h-full border-slate-900 rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/0 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
                <LogOut className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-heading font-bold text-slate-100">Logout</CardTitle>
              <CardDescription className="text-[11px] text-slate-450">
                Securely sign out of your employee portal account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-end text-xs text-rose-400 font-semibold gap-1 pt-0">
              <span>Sign Out</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        </button>

      </div>

      {/* LOWER PANEL: LEAVE BALANCES & RECENT CLOCKS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Leave Balances */}
        <div className="space-y-4">
          <h2 className="text-base font-heading font-bold text-slate-200">Leave Balances</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Paid Leave</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {paidLeave.total_days - paidLeave.used_days}
              </div>
              <span className="text-[10px] text-slate-450">Days Available</span>
            </div>
            
            <div className="p-4 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Sick Leave</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {sickLeave.total_days - sickLeave.used_days}
              </div>
              <span className="text-[10px] text-slate-450">Days Available</span>
            </div>
          </div>
          
          {/* Quick Info Box */}
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 text-[10px] text-slate-450 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Unpaid leaves do not have a balance limit and must be approved by the HR. Unpaid leaves result in payroll deductions.</span>
          </div>
        </div>

        {/* Right Side: Recent Activity Logs (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-heading font-bold text-slate-200">Recent Attendance Logs</h2>

          <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-md">
            {recentClocks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
                <HelpCircle className="w-8 h-8 text-slate-700" />
                <span>No clock-in logs found for this month.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-900/80">
                {recentClocks.map((clock, index) => (
                  <div key={index} className="p-4 flex items-center justify-between gap-4 text-xs font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-200 text-sm font-semibold">{formatDate(clock.date)}</span>
                      <span className="text-[10px] text-slate-500">Daily Attendance Record</span>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col text-right gap-0.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Check In</span>
                        <span className="text-slate-300 font-semibold">{formatTime(clock.check_in)}</span>
                      </div>

                      <div className="flex flex-col text-right gap-0.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Check Out</span>
                        <span className="text-slate-300 font-semibold">{formatTime(clock.check_out)}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                          clock.status === 'Present' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : clock.status === 'Half-day'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}>
                          {clock.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
