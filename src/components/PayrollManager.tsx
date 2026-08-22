'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { generatePayslips, getCompanyPayslips } from '@/app/actions/payroll'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  DollarSign,
  Briefcase,
  Layers,
  Activity,
  FileText,
  Printer,
  Download,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react'

export default function PayrollManager() {
  const [isPending, startTransition] = useTransition()
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Month & Year states
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [payslips, setPayslips] = useState<any[]>([])
  
  // Selected slip for detailed Dialog view
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)

  // Load Payslips
  const loadPayslips = async (m: number, y: number) => {
    startTransition(async () => {
      const data = await getCompanyPayslips(m, y)
      setPayslips(data)
    })
  }

  useEffect(() => {
    loadPayslips(month, year)
  }, [month, year])

  // Run payroll Action
  const handleRunPayroll = () => {
    startTransition(async () => {
      const res = await generatePayslips(month, year)
      if (res.success) {
        toast.success(res.message)
        loadPayslips(month, year)
      } else {
        toast.error(res.message)
      }
    })
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString()
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = [2024, 2025, 2026, 2027]

  // Print Salary Slip
  const handlePrintSlip = () => {
    const printContent = document.getElementById('printable-salary-slip')
    if (!printContent) return

    const originalContent = document.body.innerHTML
    
    // Simple print override trick for client browser
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Salary Slip</title>')
      printWindow.document.write('<style>')
      printWindow.document.write(`
        body { font-family: sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; }
        .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; }
        .table-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .table-section { margin-bottom: 20px; }
        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 10px; }
        .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #cbd5e1; font-weight: bold; font-size: 14px; margin-top: 15px; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
      `)
      printWindow.document.write('</style></head><body>')
      printWindow.document.write(printContent.innerHTML)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  // --- ANALYTICS CALCULATIONS ---
  const totalPayrollCost = payslips.reduce((acc, p) => acc + p.net_salary, 0)
  const avgNetSalary = payslips.length > 0 ? Math.round(totalPayrollCost / payslips.length) : 0
  


  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP CONTROLS PANEL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-900 rounded-2xl backdrop-blur-md">
        
        {/* Month & Year Selectors with Labels */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Month</span>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v || '1'))}>
              <SelectTrigger className="w-[130px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-[38px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                {months.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Year</span>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v || '2026'))}>
              <SelectTrigger className="w-[100px] bg-slate-950/60 border-slate-800 text-slate-200 text-xs rounded-xl h-[38px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleRunPayroll}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 rounded-xl h-[38px] flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer w-full sm:w-auto"
        >
          {isPending ? (
            <span>Processing...</span>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              <span>Generate / Run Payroll</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. LOWER PANEL: SHEET & CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Payslip listing table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-heading font-black text-slate-200">
            Monthly Payroll Roster ({months[month - 1]} {year})
          </h3>

          <Card className="glass border-slate-900 rounded-2xl overflow-hidden p-2">
            <Table>
              <TableHeader className="border-b border-slate-900">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Payable Days</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Wage</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deductions</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Salary</TableHead>
                  <TableHead className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-12 text-center text-slate-500 text-xs font-semibold">
                      <HelpCircle className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                      <span>No payslips generated for this period. Click "Run Payroll" to compute.</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((slip) => (
                    <TableRow key={slip.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-xs font-semibold">
                      <TableCell className="text-slate-100 font-bold">
                        <div>
                          <span>{slip.profile?.name}</span>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mt-0.5">
                            {slip.profile?.department || 'Staff'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono">{slip.payable_days} days</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatCurrency(slip.gross_salary)}</TableCell>
                      <TableCell className="text-rose-400 font-mono">-{formatCurrency(slip.total_deductions)}</TableCell>
                      <TableCell className="text-indigo-400 font-mono font-bold">{formatCurrency(slip.net_salary)}</TableCell>
                      
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSlip(slip)
                            setIsSlipOpen(true)
                          }}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] py-1.5 h-7 rounded-lg cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1 text-slate-450" />
                          <span>View Slip</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right Side: Recharts Analytics Charts (1 col) */}
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-slate-200">Payroll Analytics</h3>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="glass border-slate-900 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Total Expense</span>
              <span className="text-lg font-black text-indigo-400 mt-1 block">{formatCurrency(totalPayrollCost)}</span>
            </Card>
            <Card className="glass border-slate-900 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Avg Take-home</span>
              <span className="text-lg font-black text-indigo-400 mt-1 block">{formatCurrency(avgNetSalary)}</span>
            </Card>
          </div>


        </div>

      </div>

      {/* 3. PRINTABLE SALARY SLIP DIALOG */}
      {selectedSlip && (
        <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-850 text-slate-200 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="border-b border-slate-900 pb-3">
              <DialogTitle className="text-base font-heading font-black text-slate-100 flex items-center justify-between">
                <span>Employee Payslip Statement</span>
                <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {months[selectedSlip.month - 1]} {selectedSlip.year}
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-450 text-[10px]">
                Statement summary containing wage distributions and deductions.
              </DialogDescription>
            </DialogHeader>

            {/* Printable Area Wrapper */}
            <div id="printable-salary-slip" className="space-y-6 py-2 text-xs text-slate-300 font-medium">
              
              {/* Header Invoice branding */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-900/60 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 font-heading">Dayflow Systems</h2>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Corporate HRMS Payroll Slip</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Statement Date</span>
                  <span className="text-slate-200 font-mono font-bold mt-0.5 block">
                    {new Date(selectedSlip.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Employee & Schedule Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/45 p-3.5 border border-slate-900 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Employee Details</span>
                  <span className="text-slate-200 font-bold block">{selectedSlip.profile?.name}</span>
                  <span className="text-slate-400 block">{selectedSlip.profile?.department || 'General'}</span>
                  <span className="text-slate-550 block font-mono text-[9px] uppercase mt-1">
                    {selectedSlip.profile?.location || 'General Staff'}
                  </span>
                </div>
                <div className="space-y-1 text-right sm:text-left sm:pl-10">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Schedule Stats</span>
                  <span className="text-slate-200 font-bold block">Payable Days: {selectedSlip.payable_days} days</span>
                  <span className="text-slate-400 block">Basic Monthly Wage: {formatCurrency(selectedSlip.monthly_wage)}</span>
                </div>
              </div>

              {/* Earnings & Deductions Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Earnings List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-900 pb-1 tracking-wider">Earnings / Allowances</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <span>Basic Salary</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.basic)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.hra)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Standard Allowance</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.standard_allowance)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Performance Bonus</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.performance_bonus)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Leave Travel Allowance (LTA)</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.lta)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Special / Fixed Allowance</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.fixed_allowance)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-900 pb-1 tracking-wider">Deductions & Adjustments</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-2 text-slate-350">
                      <span>Employee PF Contribution</span>
                      <span className="font-mono text-red-400">-{formatCurrency(selectedSlip.employee_pf)}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-350">
                      <span>Professional Tax (PT)</span>
                      <span className="font-mono text-red-400">-{formatCurrency(selectedSlip.professional_tax)}</span>
                    </div>
                    
                    {/* Absenteeism deduction */}
                    {selectedSlip.unpaid_leave_deductions > 0 && (
                      <div className="flex justify-between gap-2 text-rose-350 pt-2 border-t border-slate-900/60 font-semibold">
                        <span>Unpaid Leave Deductions</span>
                        <span className="font-mono text-rose-400">-{formatCurrency(selectedSlip.unpaid_leave_deductions)}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Totals Section */}
              <div className="flex flex-col gap-2 pt-4 border-t-2 border-slate-900">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Gross Payable Salary</span>
                  <span className="font-mono text-slate-200">{formatCurrency(selectedSlip.gross_salary)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Total Tax Deductions</span>
                  <span className="font-mono text-red-400">-{formatCurrency(selectedSlip.total_deductions)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-100 bg-slate-950/40 p-3 rounded-xl border border-slate-900 mt-2">
                  <span className="font-heading">Net Take-home Salary</span>
                  <span className="font-mono text-indigo-400 text-base">{formatCurrency(selectedSlip.net_salary)}</span>
                </div>
              </div>

              {/* Invoice footer message */}
              <div className="text-center text-[9px] text-slate-600 pt-6 border-t border-slate-900/40">
                This is a computer generated salary statement and does not require a physical signature.
              </div>

            </div>

            {/* Print/Download triggers */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSlipOpen(false)}
                className="border-slate-800 text-xs rounded-xl h-8 cursor-pointer"
              >
                Close
              </Button>
              <Button 
                onClick={handlePrintSlip}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl h-8 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                <span>Print Statement</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
