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
  ShieldCheck,
  Sun,
  Moon,
  ChevronUp,
  ArrowLeft
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCompanyDetails } from '@/app/actions/admin'

interface HeaderNavProps {
  profile: ProfileWithCompany
  children: React.ReactNode
}

export default function HeaderNav({ profile, children }: HeaderNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Company Settings Dialog state
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false)
  const [companyName, setCompanyName] = useState(profile.company?.name || '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  
  // Attendance state
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(activeTheme)
  }, [])

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setTheme('light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    }
  }

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.error('Company Name cannot be empty.')
      return
    }
    startTransition(async () => {
      const formData = new FormData()
      formData.append('companyName', companyName)
      if (logoFile) {
        formData.append('logoFile', logoFile)
      }

      const res = await updateCompanyDetails(formData)
      if (res.success) {
        setIsCompanyDialogOpen(false)
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }
  
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 h-screen sticky top-0 p-5 z-40">
        {/* Top Section: Logo & Navigation */}
        <div className="flex flex-col gap-8">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center gap-3 group px-2 py-1.5 rounded-xl hover:bg-slate-900/30 transition-all duration-300">
            {profile.company?.logo_url ? (
              <img
                src={profile.company.logo_url}
                alt={profile.company.name}
                className="h-9 w-auto max-w-[120px] rounded-xl object-contain border border-slate-800 shadow-md"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition-all duration-300">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black tracking-tight text-slate-100 group-hover:text-white transition-colors text-sm truncate">
                {profile.company?.name || 'Dayflow'}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Enterprise Workspace</span>
            </div>
          </Link>

          {/* Navigation Menu (Vertical Links) */}
          <nav className="flex flex-col gap-1.5">
            <span className="px-3 text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1.5">Navigation</span>
            
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                isActive('/dashboard') && !isActive('/dashboard/attendance') && !isActive('/dashboard/timeoff') && !isActive('/dashboard/payroll')
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </Link>

            <Link
              href="/dashboard/attendance"
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                isActive('/dashboard/attendance')
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Attendance</span>
            </Link>

            <Link
              href="/dashboard/timeoff"
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                isActive('/dashboard/timeoff')
                  ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Time Off</span>
            </Link>

            {profile.role === 'Admin' && (
              <Link
                href="/dashboard/payroll"
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${
                  isActive('/dashboard/payroll')
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Payroll</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar Bottom Branding */}
        <div className="px-3 py-2 text-[10px] text-slate-600 font-bold tracking-wider uppercase border-t border-slate-900/60 pt-4">
          © Dayflow Odoo
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Bar for Right Side */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 gap-4 shrink-0">
          
          {pathname !== '/dashboard' ? (
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-slate-800 hover:bg-slate-850 h-9 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-400 hover:text-slate-200 transition-all"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

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

          {/* Quick theme toggler */}
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="border-slate-800 hover:bg-slate-850 p-2 h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-200"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </Button>

          {/* User profile dropdown trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/30 hover:border-slate-800/80 transition-all text-left cursor-pointer focus:outline-none max-w-[220px] h-9">
                <div className="h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-850 text-slate-300 flex overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-indigo-400">
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-100 truncate">{profile.name}</span>
                </div>
                <ChevronUp className="h-3.5 w-3.5 text-slate-500 shrink-0 transform rotate-180" />
              </button>
            } />

            <DropdownMenuContent className="w-56 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl shadow-2xl p-1" align="end" side="bottom" sideOffset={8}>
              <DropdownMenuLabel className="px-3 py-2 text-xs flex flex-col gap-0.5">
                <span className="font-heading font-bold text-slate-100 truncate">{profile.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{profile.email}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400 mt-1">
                  {profile.role === 'Admin' ? 'HR Administrator' : 'Employee'}
                </span>
              </DropdownMenuLabel>
              
              <DropdownMenuItem 
                render={
                  <Link href={`/dashboard/employees/${profile.id}`} className="flex items-center gap-2 focus:bg-slate-850 focus:text-indigo-400 cursor-pointer py-2 rounded-lg text-xs font-medium" />
                }
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                My Profile
              </DropdownMenuItem>

              {profile.role === 'Admin' && (
                <DropdownMenuItem 
                  onClick={() => setIsCompanyDialogOpen(true)}
                  className="focus:bg-slate-850 focus:text-indigo-400 cursor-pointer py-2 rounded-lg text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Company Settings</span>
                  </div>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-slate-800" />

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
                    Check OUT
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-800 mt-1" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="focus:bg-rose-50 dark:focus:bg-rose-950/50 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 cursor-pointer py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-3.5 w-3.5 text-rose-500" />
                  <span>Log Out</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        </header>

        {/* Scrollable Children Content Grid */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Company Settings Dialog Modal */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-850 text-slate-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold text-slate-100">
              Company Settings
            </DialogTitle>
            <DialogDescription className="text-slate-450 text-xs">
              Update your company name and upload your branding logo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCompany} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="compName" className="text-slate-350 text-xs font-semibold">Company Name</Label>
              <Input
                id="compName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isPending}
                className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compLogo" className="text-slate-350 text-xs font-semibold">Company Logo</Label>
              <input
                id="compLogo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setLogoFile(file)
                }}
                disabled={isPending}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer bg-slate-950/60 border border-slate-800 rounded-xl p-1"
              />
              {profile.company?.logo_url && !logoFile && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">Current Logo:</span>
                  <img src={profile.company.logo_url} alt="Logo" className="h-6 w-auto object-contain rounded" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompanyDialogOpen(false)}
                disabled={isPending}
                className="border-slate-800 text-xs rounded-xl h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl h-9 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
