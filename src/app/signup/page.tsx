'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpHR, activateEmployee } from '@/app/actions/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ShieldCheck, ArrowRight, Building2, UserCheck, Upload, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // HR Form states
  const [companyName, setCompanyName] = useState('')
  const [hrName, setHrName] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const [hrPhone, setHrPhone] = useState('')
  const [hrPassword, setHrPassword] = useState('')
  const [hrConfirmPassword, setHrConfirmPassword] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Employee Activation Form states
  const [employeeId, setEmployeeId] = useState('')
  const [empEmail, setEmpEmail] = useState('')
  const [empPassword, setEmpPassword] = useState('')
  const [empConfirmPassword, setEmpConfirmPassword] = useState('')

  // Show / Hide password states
  const [showEmpPass, setShowEmpPass] = useState(false)
  const [showEmpConfirmPass, setShowEmpConfirmPass] = useState(false)
  const [showHRPass, setShowHRPass] = useState(false)
  const [showHRConfirmPass, setShowHRConfirmPass] = useState(false)

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  React.useEffect(() => {
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

  // HR Sign Up Submit
  const handleHRSignedUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName || !hrName || !hrEmail || !hrPassword) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (hrPassword !== hrConfirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('companyName', companyName)
      formData.append('name', hrName)
      formData.append('email', hrEmail)
      formData.append('phone', hrPhone)
      formData.append('password', hrPassword)
      formData.append('confirmPassword', hrConfirmPassword)
      if (logoFile) {
        formData.append('logoFile', logoFile)
      }

      const result = await signUpHR(formData)
      if (result.success) {
        toast.success(result.message, { duration: 6000 })
        router.push('/login')
      } else {
        toast.error(result.message || 'Failed to complete registration.')
      }
    })
  }

  // Employee Activation Submit
  const handleEmployeeActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !empEmail || !empPassword) {
      toast.error('Please fill in all fields.')
      return
    }

    if (empPassword !== empConfirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('loginId', employeeId)
      formData.append('email', empEmail)
      formData.append('password', empPassword)
      formData.append('confirmPassword', empConfirmPassword)

      const result = await activateEmployee(formData)
      if (result.success) {
        toast.success(result.message, { duration: 6000 })
        router.push('/login')
      } else {
        toast.error(result.message || 'Failed to activate account.')
      }
    })
  }


  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background text-foreground font-sans">
      {/* Fixed Glowing Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-2.5 rounded-full border cursor-pointer transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-950/80 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            : 'bg-white/80 border-sky-400/30 text-sky-600 shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]'
        }`}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out py-6">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3">
            <ShieldCheck className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span className="font-heading font-bold text-sm tracking-widest text-indigo-700 dark:text-indigo-200">DAYFLOW</span>
          </div>
          <h1 className="text-2xl font-heading font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-slate-450 to-indigo-600 dark:from-slate-100 dark:via-slate-300 dark:to-indigo-300">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Onboard your organization or activate your pre-created employee account.
          </p>
        </div>

        <Tabs defaultValue="employee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800 p-1 rounded-xl mb-4">
            <TabsTrigger 
              value="employee" 
              className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Employee Activation
            </TabsTrigger>
            <TabsTrigger 
              value="hr" 
              className="rounded-lg text-xs font-semibold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Register Company (HR)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EMPLOYEE ACTIVATION */}
          <TabsContent value="employee">
            <Card className="glass shadow-2xl border-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg font-heading font-bold text-slate-100">Activate Account</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Enter your pre-assigned Employee ID (Login ID) and email to register credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmployeeActivation} className="space-y-4">
                  {/* Employee ID */}
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-slate-300 text-xs font-semibold">
                      Employee ID (Login ID)
                    </Label>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder="e.g. OIJODO20260001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm uppercase"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="empEmail" className="text-slate-300 text-xs font-semibold">
                      Work Email Address
                    </Label>
                    <Input
                      id="empEmail"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm"
                      required
                    />
                  </div>

                  {/* Password Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="empPass" className="text-slate-300 text-xs font-semibold">
                        Choose Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="empPass"
                          type={showEmpPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={empPassword}
                          onChange={(e) => setEmpPassword(e.target.value)}
                          disabled={isPending}
                          className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm pr-10 w-full"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmpPass(!showEmpPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                        >
                          {showEmpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empConfirmPass" className="text-slate-300 text-xs font-semibold">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="empConfirmPass"
                          type={showEmpConfirmPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={empConfirmPassword}
                          onChange={(e) => setEmpConfirmPassword(e.target.value)}
                          disabled={isPending}
                          className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm pr-10 w-full"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmpConfirmPass(!showEmpConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                        >
                          {showEmpConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-955/25 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300 leading-normal">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Notice:</strong> Your HR department must create your profile placeholder before you can activate your login. Your Employee ID and Email must match the details provided by your manager.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-300 mt-2 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate My Account</span>
                        <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: COMPANY / HR REGISTRATION */}
          <TabsContent value="hr">
            <Card className="glass shadow-2xl border-slate-800/80">
              <CardHeader>
                <CardTitle className="text-lg font-heading font-bold text-slate-100">Register Company</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Create a new organization space and setup the primary HR Officer account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHRSignedUp} className="space-y-4">
                  {/* Company Info Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-slate-300 text-xs font-semibold">
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyLogo" className="text-slate-300 text-xs font-semibold">
                        Company Logo
                      </Label>
                      <input
                        id="companyLogo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setLogoFile(file)
                        }}
                        disabled={isPending}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer bg-slate-900/60 border border-slate-800 rounded-lg p-1"
                      />
                    </div>
                  </div>

                  {/* Personal Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hrName" className="text-slate-300 text-xs font-semibold">
                        HR Officer Name
                      </Label>
                      <Input
                        id="hrName"
                        type="text"
                        placeholder="Sarah Jenkins"
                        value={hrName}
                        onChange={(e) => setHrName(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hrPhone" className="text-slate-300 text-xs font-semibold">
                        Contact Phone
                      </Label>
                      <Input
                        id="hrPhone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={hrPhone}
                        onChange={(e) => setHrPhone(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="hrEmail" className="text-slate-300 text-xs font-semibold">
                      HR Work Email
                    </Label>
                    <Input
                      id="hrEmail"
                      type="email"
                      placeholder="admin@company.com"
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all rounded-lg text-sm"
                      required
                    />
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hrPass" className="text-slate-300 text-xs font-semibold">
                        Choose Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="hrPass"
                          type={showHRPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={hrPassword}
                          onChange={(e) => setHrPassword(e.target.value)}
                          disabled={isPending}
                          className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-650 transition-all rounded-lg text-sm pr-10 w-full"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowHRPass(!showHRPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                        >
                          {showHRPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hrConfirmPass" className="text-slate-300 text-xs font-semibold">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="hrConfirmPass"
                          type={showHRConfirmPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={hrConfirmPassword}
                          onChange={(e) => setHrConfirmPassword(e.target.value)}
                          disabled={isPending}
                          className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-655 transition-all rounded-lg text-sm pr-10 w-full"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowHRConfirmPass(!showHRConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                        >
                          {showHRConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg shadow-lg transition-all duration-300 mt-2 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Register Company & Admin</span>
                        <Building2 className="w-4 h-4 text-indigo-200 group-hover:scale-105 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Card Footer Redirect */}
        <div className="text-center text-xs text-slate-400 mt-4">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  )
}
