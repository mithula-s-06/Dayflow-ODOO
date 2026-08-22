'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { getCheckInStatus, clockIn, clockOut } from '@/app/actions/attendance'
import { ProfileWithCompany } from '@/app/actions/profile'
import { toast } from 'sonner'
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  LogOut, 
  User, 
  Building2, 
  Play, 
  Square,
  ShieldCheck
} from 'lucide-react'

// Import standard shadcn components we installed
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderNavProps {
  profile: ProfileWithCompany
}

export default function HeaderNav({ profile }: HeaderNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Attendance state
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  
  // Load initial check-in status
  useEffect(() => {
    async function loadStatus() {
      const status = await getCheckInStatus()
      setIsCheckedIn(status.isCheckedIn)
      setCheckInTime(status.checkInTime)
    }
    loadStatus()
  }, [])

  // Handle Clock In
  const handleClockIn = async () => {
    startTransition(async () => {
      const res = await clockIn()
      if (res.success) {
        setIsCheckedIn(true)
        setCheckInTime(new Date().toISOString())
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Handle Clock Out
  const handleClockOut = async () => {
    startTransition(async () => {
      const res = await clockOut()
      if (res.success) {
        setIsCheckedIn(false)
        setCheckInTime(null)
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Handle Log Out
  const handleLogout = async () => {
    const res = await signOut()
    if (res.success) {
      toast.success('Logged out successfully.')
      router.push('/login')
      router.refresh()
    } else {
      toast.error('Logout failed.')
    }
  }

  // Active link helper
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/employees')
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* LEFT: BRANDING & NAVIGATION TABS */}
          <div className="flex items-center gap-8">
            {/* Logo Section */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              {profile.company?.logo_url ? (
                <img
                  src={profile.company.logo_url}
                  alt={profile.company.name}
                  className="h-8 w-8 rounded-lg object-cover border border-slate-800"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition-all duration-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              )}
              <span className="font-heading font-black tracking-tight text-slate-100 group-hover:text-white transition-colors text-base">
                {profile.company?.name || 'Dayflow'}
              </span>
            </Link>

            {/* Nav Links (Tabs style matching Excalidraw) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-900 rounded-xl">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive('/dashboard') && !isActive('/dashboard/attendance') && !isActive('/dashboard/timeoff') && !isActive('/dashboard/payroll')
                    ? 'bg-slate-850 text-indigo-400 shadow-sm border border-slate-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Employees
              </Link>
              <Link
                href="/dashboard/attendance"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive('/dashboard/attendance')
                    ? 'bg-slate-850 text-indigo-400 shadow-sm border border-slate-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Attendance
              </Link>
              <Link
                href="/dashboard/timeoff"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive('/dashboard/timeoff')
                    ? 'bg-slate-850 text-indigo-400 shadow-sm border border-slate-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Time Off
              </Link>
              {profile.role === 'Admin' && (
                <Link
                  href="/dashboard/payroll"
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                    isActive('/dashboard/payroll')
                      ? 'bg-slate-850 text-indigo-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Payroll
                </Link>
              )}
            </nav>
          </div>

          {/* RIGHT: ATTENDANCE STATUS DOT & AVATAR MENU */}
          <div className="flex items-center gap-4">
            
            {/* Real-time pulse status indicator */}
            <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 border border-slate-900 rounded-xl">
              <span className="relative flex h-2 w-2">
                {isCheckedIn ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </>
                )}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
            </div>

            {/* Dropdown Menu (RADIX Wrapper) */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 focus:outline-none overflow-hidden transition-all cursor-pointer">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-indigo-400">
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </button>
              } />

              <DropdownMenuContent className="w-56 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl shadow-2xl p-1" align="end">
                <DropdownMenuLabel className="px-3 py-2 text-xs flex flex-col gap-0.5">
                  <span className="font-heading font-bold text-slate-100 truncate">{profile.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">{profile.email}</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 mt-1">
                    {profile.role === 'Admin' ? 'HR Administrator' : 'Employee'}
                  </span>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="bg-slate-800" />
                
                <DropdownMenuItem 
                  render={
                    <Link href={`/dashboard/employees/${profile.id}`} className="flex items-center gap-2 focus:bg-slate-850 focus:text-indigo-400 cursor-pointer py-2 rounded-lg text-xs font-medium" />
                  }
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  My Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-800" />

                {/* Clock-In/Out controls in dropdown menu (matching systray) */}
                <DropdownMenuLabel className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Systray Tracker
                </DropdownMenuLabel>

                <div className="px-1 py-1 flex flex-col gap-1">
                  {!isCheckedIn ? (
                    <Button
                      size="sm"
                      onClick={handleClockIn}
                      disabled={isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 h-8 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer w-full"
                    >
                      <Play className="h-3 w-3 text-white fill-white" />
                      Check IN
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleClockOut}
                      disabled={isPending}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1.5 h-8 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer w-full"
                    >
                      <Square className="h-3 w-3 text-white fill-white" />
                      Check Out
                    </Button>
                  )}
                </div>

                <DropdownMenuSeparator className="bg-slate-800 mt-1" />
 
                 <DropdownMenuItem 
                   onClick={handleLogout}
                   className="focus:bg-rose-950 focus:text-rose-400 text-rose-400 cursor-pointer py-2 rounded-lg text-xs font-semibold"
                 >
                   <div className="flex items-center gap-2">
                     <LogOut className="h-3.5 w-3.5" />
                     Log Out
                   </div>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>

        </div>
      </div>
    </header>
  )
}
