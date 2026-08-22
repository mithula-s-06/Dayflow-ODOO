'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EmployeeWithStatus } from '@/app/actions/dashboard'
import { onboardEmployee } from '@/app/actions/admin'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Building,
  MapPin,
  Mail,
  Phone,
  Plane,
  AlertCircle,
  Key,
  Copy,
  CheckCircle,
  HelpCircle,
  Loader2
} from 'lucide-react'

interface AdminDashboardProps {
  initialEmployees: EmployeeWithStatus[]
}

export default function AdminDashboard({ initialEmployees }: AdminDashboardProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>(initialEmployees)
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedLoc, setSelectedLoc] = useState('ALL')

  // Onboard Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'Admin' | 'Employee'>('Employee')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0])
  const [monthlyWage, setMonthlyWage] = useState('')
  const [managerId, setManagerId] = useState('NONE')

  // Credentials Result State
  const [credentials, setCredentials] = useState<{
    id: string
    pass: string
  } | null>(null)

  // Filter lists
  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))] as string[]
  const locations = ['ALL', ...Array.from(new Set(employees.map(e => e.location).filter(Boolean)))] as string[]

  // Handle Onboarding Form Submit
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Name and Email are required.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('role', role)
      formData.append('department', department)
      formData.append('location', location)
      formData.append('dateOfJoining', dateOfJoining)
      formData.append('monthlyWage', monthlyWage)
      if (managerId !== 'NONE') {
        formData.append('managerId', managerId)
      }

      const res = await onboardEmployee(formData)
      if (res.success && res.employeeId && res.tempPassword) {
        setCredentials({
          id: res.employeeId,
          pass: res.tempPassword,
        })
        toast.success('Employee successfully created!')
        
        // Reset form
        setName('')
        setEmail('')
        setPhone('')
        setRole('Employee')
        setDepartment('')
        setLocation('')
        setMonthlyWage('')
        setManagerId('NONE')

        // Refresh lists
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to onboard employee.')
      }
    })
  }

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!credentials) return
    const text = `Employee ID: ${credentials.id}\nTemporary Password: ${credentials.pass}\nLogin link: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    toast.success('Credentials copied to clipboard!')
  }

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.login_id && emp.login_id.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept
    const matchesLoc = selectedLoc === 'ALL' || emp.location === selectedLoc

    return matchesSearch && matchesDept && matchesLoc
  })

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER CONTROLS: SEARCH, FILTERS & NEW EMPLOYEE BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl backdrop-blur-md">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <Input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950/60 border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-[38px] transition-all"
          />
        </div>

        {/* Filters and New Button */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          {/* Department Filter */}
          <Select value={selectedDept} onValueChange={(val) => setSelectedDept(val || '')}>
            <SelectTrigger className="w-[140px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-[38px] focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
              {departments.map(dept => (
                <SelectItem key={dept} value={dept || 'Unassigned'} className="text-xs focus:bg-slate-850 focus:text-indigo-400">
                  {dept || 'Unassigned'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location Filter */}
          <Select value={selectedLoc} onValueChange={(val) => setSelectedLoc(val || '')}>
            <SelectTrigger className="w-[140px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-[38px] focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
              {locations.map(loc => (
                <SelectItem key={loc} value={loc || 'Unassigned'} className="text-xs focus:bg-slate-850 focus:text-indigo-400">
                  {loc || 'Unassigned'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ONBOARD MODAL (shadcn Dialog) */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setCredentials(null) // clear credentials on modal close
          }}>
            <DialogTrigger render={
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer h-[38px] flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" />
                <span>NEW</span>
              </Button>
            } />

            <DialogContent className="max-w-md bg-slate-900 border-slate-850 text-slate-200 rounded-2xl shadow-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-heading font-bold text-slate-100">
                  {credentials ? 'Account Credentials' : 'Onboard New Employee'}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {credentials 
                    ? 'Save these credentials and share them with the employee. They will be forced to change this password.' 
                    : 'Fill in the employee details to register a profile placeholder and generate their Login ID.'}
                </DialogDescription>
              </DialogHeader>

              {credentials ? (
                /* SUCCESS STATE: Credentials Share Screen */
                <div className="space-y-4 py-2 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Employee Login ID</span>
                      <span className="text-sm font-mono font-bold text-indigo-400 select-all">{credentials.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-slate-900 pt-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Temporary Password</span>
                      <span className="text-sm font-mono font-bold text-indigo-400 select-all">{credentials.pass}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>The user was successfully configured. They can log in using these credentials immediately.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyCredentials} 
                      className="border-slate-800 hover:bg-slate-850 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Credentials</span>
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsDialogOpen(false)
                        setCredentials(null)
                      }} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* FORM STATE: Onboarding Details Input */
                <form onSubmit={handleOnboard} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-350 text-xs font-semibold">Employee Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                      required
                    />
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-350 text-xs font-semibold">Work Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-slate-350 text-xs font-semibold">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Department & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="dept" className="text-slate-350 text-xs font-semibold">Department</Label>
                      <Input
                        id="dept"
                        type="text"
                        placeholder="e.g. Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loc" className="text-slate-350 text-xs font-semibold">Location</Label>
                      <Input
                        id="loc"
                        type="text"
                        placeholder="e.g. London"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Joining Date & Monthly Wage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="joinDate" className="text-slate-350 text-xs font-semibold">Joining Date</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={dateOfJoining}
                        onChange={(e) => setDateOfJoining(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wage" className="text-slate-350 text-xs font-semibold">Gross Monthly Wage (INR)</Label>
                      <Input
                        id="wage"
                        type="number"
                        placeholder="e.g. 50000"
                        value={monthlyWage}
                        onChange={(e) => setMonthlyWage(e.target.value)}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Manager Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="manager" className="text-slate-350 text-xs font-semibold">Reports To (Manager)</Label>
                    <Select value={managerId} onValueChange={(val) => setManagerId(val || 'NONE')}>
                      <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        <SelectItem value="NONE" className="text-xs">No Manager</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.name} ({emp.department || 'General'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-350 text-xs font-semibold">System Permission Role</Label>
                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                      <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        <SelectItem value="Employee" className="text-xs">Employee (Standard Access)</SelectItem>
                        <SelectItem value="Admin" className="text-xs">HR Officer / Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isPending}
                      className="border-slate-800 hover:bg-slate-850 text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Onboard Employee</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* EMPLOYEE CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-slate-900 bg-slate-900/20 rounded-2xl">
            <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm font-semibold">No employees found matching the filters.</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <Card 
              key={emp.id} 
              onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
              className="glass glass-hover p-5 border-slate-900 rounded-2xl cursor-pointer relative group flex flex-col gap-4 overflow-hidden"
            >
              {/* Radial Hover Gradient Indicator */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-start justify-between gap-3 relative z-10">
                {/* Employee Main Avatar info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-400">
                        {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-heading font-black text-sm text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                      {emp.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 tracking-wide font-medium mt-0.5 truncate uppercase">
                      {emp.login_id || 'ID pending'}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate font-semibold mt-1">
                      {emp.role === 'Admin' ? 'HR Admin' : 'Staff Employee'}
                    </span>
                  </div>
                </div>

                {/* Status Dot / Icon (Top Right Corner) */}
                <div className="flex items-center justify-center p-1.5 rounded-lg bg-slate-950/60 border border-slate-900">
                  {emp.todayStatus === 'Present' && (
                    <span className="relative flex h-2.5 w-2.5" title="Present (Checked In)">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}
                  {emp.todayStatus === 'Present-completed' && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" title="Present (Checked Out)" />
                  )}
                  {emp.todayStatus === 'Leave' && (
                    <span title="On Leave">
                      <Plane className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                    </span>
                  )}
                  {emp.todayStatus === 'Absent' && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" title="Absent" />
                  )}
                </div>
              </div>

              {/* Card Meta Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-[10px] text-slate-450 relative z-10 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">{emp.department || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">{emp.location || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate text-slate-400">{emp.email}</span>
                </div>
              </div>

            </Card>
          ))
        )}
      </div>

    </div>
  )
}
