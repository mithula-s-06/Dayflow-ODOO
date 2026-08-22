'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitTimeOffRequest, approveTimeOffRequest, rejectTimeOffRequest } from '@/app/actions/timeoff'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar as CalendarIcon,
  Plus,
  Check,
  X,
  Paperclip,
  Plane,
  AlertCircle,
  HelpCircle,
  FileText,
  Loader2,
  CheckCircle
} from 'lucide-react'

// Indian Public Holidays (mock fixed dates)
const PUBLIC_HOLIDAYS = [
  '2026-01-01', // New Year
  '2026-01-26', // Republic Day
  '2026-08-15', // Independence Day
  '2026-10-02', // Gandhi Jayanti
  '2026-11-12', // Diwali (mock)
  '2026-12-25', // Christmas
]

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

interface TimeOffManagerProps {
  role: 'Admin' | 'Employee'
  initialAllocations: { leave_type: string; total_days: number; used_days: number }[]
  initialRequests: any[]
  employeeName?: string
}

export default function TimeOffManager({
  role,
  initialAllocations,
  initialRequests,
  employeeName = 'Employee'
}: TimeOffManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Requests and allocations state
  const [allocations, setAllocations] = useState(initialAllocations)
  const [requests, setRequests] = useState(initialRequests)

  // --- NEW REQUEST FORM STATE ---
  const [leaveType, setLeaveType] = useState<'Paid time off' | 'Sick Leave' | 'Unpaid Leaves'>('Paid time off')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [computedDays, setComputedDays] = useState(0)

  // --- ADMIN APPROVAL COMMENT STATES ---
  const [adminCommentsMap, setAdminCommentsMap] = useState<Record<string, string>>({})

  // Update computed days count dynamically on dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      setComputedDays(0)
      return
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      setComputedDays(0)
      return
    }

    let count = 0
    const cur = new Date(start)
    while (cur <= end) {
      const dayOfWeek = cur.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        count++
      }
      cur.setDate(cur.getDate() + 1)
    }
    setComputedDays(count)
  }, [startDate, endDate])

  // Mock certificate uploader
  const handleMockUpload = () => {
    setAttachmentName('sick_leave_certificate.pdf')
    setAttachmentUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
    toast.success('Certificate uploaded successfully!')
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || computedDays === 0) {
      toast.error('Please enter a valid date range.')
      return
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    if (startDate < todayStr) {
      toast.error('Start date must be either today or a future date.')
      return
    }

    if (endDate < startDate) {
      toast.error('End date must be on or after the start date.')
      return
    }

    if (leaveType === 'Sick Leave' && !attachmentUrl) {
      toast.error('Medical certificate upload is required for Sick Leave.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('leaveType', leaveType)
      formData.append('startDate', startDate)
      formData.append('endDate', endDate)
      formData.append('remarks', remarks)
      formData.append('attachmentUrl', attachmentUrl)

      const res = await submitTimeOffRequest(formData)
      if (res.success) {
        setIsDialogOpen(false)
        setStartDate('')
        setEndDate('')
        setRemarks('')
        setAttachmentName('')
        setAttachmentUrl('')
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Handle Admin Approve
  const handleApprove = (reqId: string) => {
    const comments = adminCommentsMap[reqId] || ''
    startTransition(async () => {
      const res = await approveTimeOffRequest(reqId, comments || null)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Handle Admin Reject
  const handleReject = (reqId: string) => {
    const comments = adminCommentsMap[reqId] || ''
    startTransition(async () => {
      const res = await rejectTimeOffRequest(reqId, comments || null)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // Refresh lists on parent updates
  useEffect(() => {
    setAllocations(initialAllocations)
    setRequests(initialRequests)
  }, [initialAllocations, initialRequests])

  // Get balance info
  const paidLeave = allocations.find(b => b.leave_type === 'Paid time off') || { total_days: 0, used_days: 0 }
  const sickLeave = allocations.find(b => b.leave_type === 'Sick Leave') || { total_days: 0, used_days: 0 }

  // Map dates to leave status (for Yearly Calendar)
  const getLeaveStatusForDate = (dateStr: string) => {
    // Check if public holiday first
    if (PUBLIC_HOLIDAYS.includes(dateStr)) return 'Holiday'

    // Check requests
    for (const req of requests) {
      if (req.status === 'Approved' && dateStr >= req.start_date && dateStr <= req.end_date) {
        return 'Approved'
      }
      if (req.status === 'Pending' && dateStr >= req.start_date && dateStr <= req.end_date) {
        return 'Pending'
      }
      if (req.status === 'Rejected' && dateStr >= req.start_date && dateStr <= req.end_date) {
        return 'Rejected'
      }
    }
    return 'None'
  }

  // Year Months listing for Yearly Grid Layout
  const yearMonths = Array.from({ length: 12 }, (_, i) => i) // 0 to 11 (Jan to Dec)
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Render month grid items
  const renderMonthDays = (monthIndex: number) => {
    const year = 2026 // fixed mockup year
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const firstDayIndex = new Date(year, monthIndex, 1).getDay() // 0 is Sunday
    
    // empty blocks for offset
    const offset = Array.from({ length: firstDayIndex }, (_, i) => i)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return (
      <div key={monthIndex} className="bg-slate-900/40 border border-slate-900/60 p-2.5 rounded-xl flex flex-col gap-1.5 text-center">
        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider text-left border-b border-slate-900 pb-1 mb-1">
          {monthNames[monthIndex]}
        </h4>
        
        {/* Month Header */}
        <div className="grid grid-cols-7 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5 text-[8px] font-bold">
          {offset.map(o => <span key={`offset-${o}`} />)}
          
          {days.map(day => {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const status = getLeaveStatusForDate(dateStr)
            
            let colorClass = 'text-slate-400 hover:text-white'
            let titleText = dateStr

            if (status === 'Approved') {
              colorClass = 'bg-emerald-500/20 text-emerald-400 rounded-sm'
              titleText += ' (Leave Approved)'
            } else if (status === 'Pending') {
              colorClass = 'bg-amber-500/20 text-amber-400 rounded-sm'
              titleText += ' (Leave Pending)'
            } else if (status === 'Rejected') {
              colorClass = 'bg-rose-500/20 text-rose-400 rounded-sm'
              titleText += ' (Leave Rejected)'
            } else if (status === 'Holiday') {
              colorClass = 'bg-indigo-500/25 text-indigo-300 rounded-sm'
              titleText += ' (Public Holiday)'
            }

            return (
              <span 
                key={day} 
                className={`py-0.5 cursor-help ${colorClass}`}
                title={titleText}
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* =============================================================
          1. EMPLOYEE TIME OFF INTERFACE
          ============================================================= */}
      {role === 'Employee' && (
        <>
          {/* TOP CONTROLS & NEW BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl backdrop-blur-md">
            
            {/* Balances summary */}
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 block shrink-0" />
                <span className="text-slate-400">Paid Leave:</span>
                <span className="font-bold text-slate-200">{(paidLeave.total_days - paidLeave.used_days)} days left</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 block shrink-0" />
                <span className="text-slate-400">Sick Leave:</span>
                <span className="font-bold text-slate-200">{(sickLeave.total_days - sickLeave.used_days)} days left</span>
              </div>
            </div>

            {/* Request Modal Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 rounded-xl cursor-pointer h-9 flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>NEW REQUEST</span>
                </Button>
              } />

              <DialogContent className="max-w-md bg-slate-900 border-slate-850 text-slate-200 rounded-2xl shadow-2xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-base font-heading font-bold text-slate-100">
                    Time Off Request
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    Specify the date range and leave type. Calculations exclude weekend days automatically.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {/* Name Read-only */}
                  <div className="space-y-1">
                    <Label className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">Employee</Label>
                    <Input
                      type="text"
                      value={employeeName}
                      disabled
                      className="bg-slate-950/40 border-slate-850 opacity-60 text-slate-350 rounded-xl text-xs h-9 cursor-not-allowed"
                    />
                  </div>

                  {/* Leave Type */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-350 text-xs font-semibold">Time Off Type</Label>
                    <Select 
                      value={leaveType} 
                      onValueChange={(val: any) => {
                        setLeaveType(val)
                        // Reset attachments if changing from Sick Leave
                        if (val !== 'Sick Leave') {
                          setAttachmentUrl('')
                          setAttachmentName('')
                        }
                      }}
                    >
                      <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        <SelectItem value="Paid time off" className="text-xs">Paid Time Off</SelectItem>
                        <SelectItem value="Sick Leave" className="text-xs">Sick Leave</SelectItem>
                        <SelectItem value="Unpaid Leaves" className="text-xs">Unpaid Leaves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="startD" className="text-slate-350 text-xs font-semibold">Start Date</Label>
                      <Input
                        id="startD"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endD" className="text-slate-350 text-xs font-semibold">End Date</Label>
                      <Input
                        id="endD"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                        disabled={isPending}
                        className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Allocation computed count */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold">Calculated Business Days:</span>
                    <span className="font-mono font-black text-indigo-400 text-sm">
                      {String(computedDays).padStart(2, '0')} Days
                    </span>
                  </div>

                  {/* Medical Certificate Uploader (Sick Leave Only) */}
                  {leaveType === 'Sick Leave' && (
                    <div className="space-y-1.5 border-t border-slate-900 pt-3">
                      <Label className="text-slate-350 text-xs font-semibold">Medical Certificate Attachment</Label>
                      {attachmentName ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-slate-200 truncate flex-1">{attachmentName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentUrl('')
                              setAttachmentName('')
                            }}
                            className="text-red-400 hover:text-red-300 font-semibold cursor-pointer underline text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleMockUpload}
                          disabled={isPending}
                          className="border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 h-9 w-full text-xs rounded-xl cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span>Upload Sick Certificate</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <Label htmlFor="rem" className="text-slate-355 text-xs font-semibold">Remarks / Comments</Label>
                    <Input
                      id="rem"
                      type="text"
                      placeholder="e.g. Family wedding or Medical checkup"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isPending}
                      className="border-slate-800 text-xs rounded-xl cursor-pointer"
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
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Request</span>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

          </div>

          {/* YEARLY MONTHS CALENDARS GRID (12 Mini Calendars) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-heading font-black text-slate-200">Yearly Time Off Calendar (2026)</h3>
              
              {/* Calendar Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/40" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/20 border border-rose-500/40" />
                  <span>Refused</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/25 border border-indigo-500/40" />
                  <span>Holidays</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {yearMonths.map(monthIdx => renderMonthDays(monthIdx))}
            </div>
          </div>

          {/* REQUESTS LIST TABLE */}
          <div className="space-y-4">
            <h3 className="text-sm font-heading font-black text-slate-200">Time Off Requests History</h3>
            
            <Card className="glass border-slate-900 rounded-2xl overflow-hidden p-2">
              <Table>
                <TableHeader className="border-b border-slate-900">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Leave Type</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Start Date</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">End Date</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Duration</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Remarks</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Attachment</TableHead>
                    <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="py-12 text-center text-slate-500 text-xs font-semibold">
                        <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <span>No leave requests submitted yet.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((req) => (
                      <TableRow key={req.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-xs font-semibold">
                        <TableCell className="text-slate-100">{req.leave_type}</TableCell>
                        <TableCell className="text-slate-350">{formatDate(req.start_date)}</TableCell>
                        <TableCell className="text-slate-350">{formatDate(req.end_date)}</TableCell>
                        <TableCell className="text-slate-200 font-mono">{req.num_days} days</TableCell>
                        <TableCell className="text-slate-400 max-w-[140px] truncate" title={req.remarks}>{req.remarks || '--'}</TableCell>
                        <TableCell>
                          {req.attachment_url ? (
                            <a 
                              href={req.attachment_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
                            >
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <span>Certificate</span>
                            </a>
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}

      {/* =============================================================
          2. ADMIN/HR APPROVALS QUEUE VIEW
          ============================================================= */}
      {role === 'Admin' && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-slate-200">Employee Leave Approvals Queue</h3>

          <Card className="glass border-slate-900 rounded-2xl overflow-hidden p-2">
            <Table>
              <TableHeader className="border-b border-slate-900">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Leave Type</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Start Date</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">End Date</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Duration</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Certificate</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Admin Comment</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-12 text-center text-slate-500 text-xs font-semibold">
                      <CheckCircle className="w-8 h-8 text-emerald-600/80 mx-auto mb-2" />
                      <span>No leave requests submitted yet.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-xs font-semibold animate-fade-in">
                      <TableCell className="text-slate-100 font-bold">
                        <div>
                          <span>{req.profile?.name}</span>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mt-0.5">
                            {req.profile?.department || 'Staff'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-200">{req.leave_type}</TableCell>
                      <TableCell className="text-slate-350">{formatDate(req.start_date)}</TableCell>
                      <TableCell className="text-slate-350">{formatDate(req.end_date)}</TableCell>
                      <TableCell className="text-indigo-400 font-mono">{req.num_days} days</TableCell>
                      <TableCell>
                        {req.attachment_url ? (
                          <a 
                            href={req.attachment_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span>View PDF</span>
                          </a>
                        ) : (
                          <span className="text-slate-650">None</span>
                        )}
                      </TableCell>
                      
                      {/* Comments Column */}
                      <TableCell>
                        {req.status === 'Pending' ? (
                          <Input
                            type="text"
                            placeholder="Add comments..."
                            value={adminCommentsMap[req.id] || ''}
                            onChange={(e) => setAdminCommentsMap({
                              ...adminCommentsMap,
                              [req.id]: e.target.value
                            })}
                            disabled={isPending}
                            className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-[30px] w-[150px] font-medium"
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[11px] font-medium max-w-[150px] block truncate" title={req.admin_comments || ''}>
                            {req.admin_comments || '--'}
                          </span>
                        )}
                      </TableCell>
 
                      {/* Actions Column */}
                      <TableCell className="text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req.id)}
                              disabled={isPending}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReject(req.id)}
                              disabled={isPending}
                              className="bg-rose-600 hover:bg-rose-500 text-white p-2 h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                            req.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

    </div>
  )
}
