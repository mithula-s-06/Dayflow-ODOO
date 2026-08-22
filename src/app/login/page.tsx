'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  
  // Show / Hide password state
  const [showPassword, setShowPassword] = useState(false)

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginInput || !password) {
      toast.error('Please fill in all fields.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('loginInput', loginInput)
      formData.append('password', password)

      const result = await signIn(formData)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard')
      } else {
        toast.error(result.message || 'Failed to sign in. Please check your credentials.')
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/40 border border-slate-800/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3 shadow-inner shadow-indigo-500/5">
            <ShieldCheck className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="font-heading font-bold text-sm tracking-widest text-indigo-200">DAYFLOW</span>
          </div>
          <h1 className="text-3xl font-heading font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-[280px]">
            Every workday, perfectly aligned. Log in to access your dashboard.
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <Card className="glass shadow-2xl border-slate-800/80">
          <CardHeader>
            <CardTitle className="text-lg font-heading font-bold text-slate-100">Sign In</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Enter your Employee ID or email address below to log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Login ID / Email */}
              <div className="space-y-2">
                <Label htmlFor="loginInput" className="text-slate-300 text-xs font-semibold">
                  Login ID or Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="loginInput"
                    type="text"
                    placeholder="e.g. OIJODO20260001 or email@company.com"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    disabled={isPending}
                    className="pl-10 bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all duration-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-semibold">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="pl-10 pr-10 bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-all duration-300 rounded-lg text-sm w-full"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 mt-2 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t border-slate-900/80 pt-4 mt-2">
            <div className="text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Sign up / Activate here
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Credit */}
        <div className="mt-8 text-center text-slate-600 text-[10px] tracking-wider uppercase font-semibold">
          © {new Date().getFullYear()} Dayflow Inc. All rights reserved.
        </div>
      </div>
    </div>
  )
}
