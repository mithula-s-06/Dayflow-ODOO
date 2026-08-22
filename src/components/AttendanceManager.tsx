'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getMyAttendanceLogs, getCompanyAttendanceLogs } from '@/app/actions/attendance'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react'

interface AttendanceManagerProps {
  role: 'Admin' | 'Employee'
}

export default function AttendanceManager({ role }: AttendanceManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- EMPLOYEE STATE ---
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  
  const [empLogs, setEmpLogs] = useState<any[]>([])
  const [presentCount, setPresentCount] = useState(0)
  const [leaveCount, setLeaveCount] = useState(0)
  const [totalWorkingDays, setTotalWorkingDays] = useState(20)

  // --- ADMIN STATE ---
  const [adminDate, setAdminDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [adminSearch, setAdminSearch] = useState('')

  // Load Employee Logs
  const loadEmployeeLogs = async (m: number, y: number) => {
    startTransition(async () => {
      const data = await getMyAttendanceLogs(m, y)
      setEmpLogs(data.logs)
      setPresentCount(data.presentCount)
      setLeaveCount(data.leaveCount)
      setTotalWorkingDays(data.totalWorkingDays)
    })
  }

  // Load Admin Logs
  const loadAdminLogs = async (dateStr: string) => {
    startTransition(async () => {
      const data = await getCompanyAttendanceLogs(dateStr)
      setAdminLogs(data)
    })
  }

  useEffect(() => {
    if (role === 'Employee') {
      loadEmployeeLogs(month, year)
    } else {
      loadAdminLogs(adminDate)
    }
  }, [role, month, year, adminDate])

  // --- EMPLOYEE NAV CONTROLS ---
  const handlePrevMonth = () => {
    let newM = month - 1
    let newY = year
    if (newM < 1) {
      newM = 12
      newY = year - 1
    }
    setMonth(newM)
    setYear(newY)
  }

  const handleNextMonth = () => {
    let newM = month + 1
    let newY = year
    if (newM > 12) {
      newM = 1
      newY = year + 1
    }
    setMonth(newM)
    setYear(newY)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // --- ADMIN NAV CONTROLS ---
  const handlePrevDay = () => {
    const d = new Date(adminDate)
    d.setDate(d.getDate() - 1)
    setAdminDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  }

  const handleNextDay = () => {
    const d = new Date(adminDate)
    d.setDate(d.getDate() + 1)
    setAdminDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  }

  // --- FORMATTING HELPERS ---
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filter admin logs
  const filteredAdminLogs = adminLogs.filter(log => {
    const empName = log.profile?.name || ''
    return empName.toLowerCase().includes(adminSearch.toLowerCase())
  })

  return (
    <div className="space-y-6 font-sans">
      
      {/* =============================================================
          1. EMPLOYEE ATTENDANCE VIEW
          ============================================================= */}
      {role === 'Employee' && (
        <>
          {/* TOP CONTROLS: MONTH SELECTOR */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl backdrop-blur-md">
            <h2 className="text-sm font-heading font-black text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Attendance History</span>
            </h2>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handlePrevMonth}
                disabled={isPending}
                className="border-slate-800 hover:bg-slate-850 p-2 h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </Button>
              
              <div className="text-xs font-bold text-slate-200 px-3 bg-slate-950/60 border border-slate-850 h-9 flex items-center justify-center rounded-xl">
                {months[month - 1]} {year}
              </div>

              <Button 
                variant="outline" 
                onClick={handleNextMonth}
                disabled={isPending}
                className="border-slate-800 hover:bg-slate-850 p-2 h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* ANALYTICS STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="glass border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Days Present</span>
              <span className="text-2xl font-black text-slate-100 mt-2 block">{presentCount}</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Active present clock records</span>
            </Card>

            <Card className="glass border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Leaves Taken</span>
              <span className="text-2xl font-black text-slate-100 mt-2 block">{leaveCount}</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Approved paid / sick leave days</span>
            </Card>

            <Card className="glass border-slate-900 rounded-2xl p-5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Working Days</span>
              <span className="text-2xl font-black text-slate-100 mt-2 block">{totalWorkingDays}</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Excluding weekend days</span>
            </Card>
          </div>

          {/* ATTENDANCE HISTORY TABLE */}
          <Card className="glass border-slate-900 rounded-2xl overflow-hidden p-2">
            <Table>
              <TableHeader className="border-b border-slate-900">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Check In</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Check Out</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Work Hours</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Extra Hours</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empLogs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500 text-xs font-semibold">
                      <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <span>No attendance logs recorded for this month.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  empLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-xs font-semibold">
                      <TableCell className="text-slate-200">{formatDate(log.date)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatTime(log.check_in)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatTime(log.check_out)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{log.work_hours ? `${log.work_hours} hrs` : '--'}</TableCell>
                      <TableCell className="text-slate-300 font-mono">
                        {log.extra_hours && log.extra_hours > 0 ? (
                          <span className="text-emerald-400">+{log.extra_hours} hrs</span>
                        ) : (
                          '0.00'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                          log.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'Half-day'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* =============================================================
          2. ADMIN/HR ATTENDANCE VIEW
          ============================================================= */}
      {role === 'Admin' && (
        <>
          {/* HEADER CONTROLS: DATE SELECTION & SEARCH */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl backdrop-blur-md">
            
            {/* Search */}
            <div className="relative w-full sm:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="pl-9 bg-slate-950/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-[38px] transition-all"
              />
            </div>

            {/* Date Selector Navigation */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button 
                variant="outline" 
                onClick={handlePrevDay}
                disabled={isPending}
                className="border-slate-800 hover:bg-slate-850 p-2 h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </Button>
              
              <Input
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
                disabled={isPending}
                className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9 w-[150px] shrink-0"
              />

              <Button 
                variant="outline" 
                onClick={handleNextDay}
                disabled={isPending}
                className="border-slate-800 hover:bg-slate-850 p-2 h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* ADMIN LIST TABLE */}
          <Card className="glass border-slate-900 rounded-2xl overflow-hidden p-2">
            <Table>
              <TableHeader className="border-b border-slate-900">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Department</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Check In</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Check Out</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Work Hours</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Extra Hours</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdminLogs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center text-slate-500 text-xs font-semibold">
                      <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <span>No active check-in records for this date.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdminLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-xs font-semibold">
                      <TableCell className="text-slate-100 font-bold">{log.profile?.name}</TableCell>
                      <TableCell className="text-slate-400">{log.profile?.department || 'General'}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatTime(log.check_in)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatTime(log.check_out)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{log.work_hours ? `${log.work_hours} hrs` : '--'}</TableCell>
                      <TableCell className="text-slate-300 font-mono">
                        {log.extra_hours && log.extra_hours > 0 ? (
                          <span className="text-emerald-400">+{log.extra_hours} hrs</span>
                        ) : (
                          '0.00'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                          log.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'Half-day'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

    </div>
  )
}
