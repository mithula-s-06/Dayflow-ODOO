'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileWithCompany, addSkill, deleteSkill, updateProfileResume, updatePrivateInfo, updateSalaryConfig, uploadCertificate, uploadAvatar, deleteAvatar } from '@/app/actions/profile'
import { changePassword } from '@/app/actions/auth'
import { deleteEmployee } from '@/app/actions/admin'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  User,
  ShieldAlert,
  Edit2,
  Check,
  Plus,
  Trash2,
  Lock,
  Loader2,
  Building,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Award,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react'

// Dummy textarea if not installed, or import standard input
const TextareaInput = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<'textarea'>>(({ ...props }, ref) => (
  <textarea
    {...props}
    ref={ref}
    className="flex min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
  />
))
TextareaInput.displayName = 'TextareaInput'
const Textarea = TextareaInput

interface ProfileDetailsProps {
  viewedProfile: ProfileWithCompany
  currentUser: { id: string; role: 'Admin' | 'Employee' }
  skills: { id: string; name: string; type: 'skill' | 'certification'; document_url?: string | null }[]
  salaryConfig: {
    monthly_wage: number
    working_days_per_week: number
    working_hours_per_day: number
    basic_salary_pct: number
    hra_pct: number
    standard_allowance: number
    performance_bonus_pct: number
    lta_pct: number
    pf_rate: number
    professional_tax: number
  } | null
  managersList: { id: string; name: string }[]
}

export default function ProfileDetails({
  viewedProfile,
  currentUser,
  skills,
  salaryConfig,
  managersList
}: ProfileDetailsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isOwner = currentUser.id === viewedProfile.id
  const isAdmin = currentUser.role === 'Admin'
  const canEditAll = isAdmin
  const canEditContact = isOwner || isAdmin

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isAvatarDeleteOpen, setIsAvatarDeleteOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleDeleteProfile = () => {
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    startTransition(async () => {
      const res = await deleteEmployee(viewedProfile.id)
      if (res.success) {
        toast.success(res.message)
        setIsDeleteConfirmOpen(false)
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const confirmDeleteAvatar = () => {
    startTransition(async () => {
      const res = await deleteAvatar(viewedProfile.id)
      if (res.success) {
        toast.success(res.message)
        setIsAvatarDeleteOpen(false)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const confirmDeleteSkill = () => {
    if (!skillToDelete) return
    startTransition(async () => {
      const res = await deleteSkill(skillToDelete.id, viewedProfile.id)
      if (res.success) {
        toast.success(res.message)
        setSkillToDelete(null)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  // --- Resume Tab States ---
  const [isEditingResume, setIsEditingResume] = useState(false)
  const [about, setAbout] = useState(viewedProfile.about || '')
  const [whatILove, setWhatILove] = useState(viewedProfile.what_i_love || '')
  const [interests, setInterests] = useState(viewedProfile.interests || '')
  
  // Add Skill states
  const [newSkillName, setNewSkillName] = useState('')
  const [newCertName, setNewCertName] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)

  // --- Private Info Tab States ---
  const [isEditingPrivate, setIsEditingPrivate] = useState(false)
  const [phone, setPhone] = useState(viewedProfile.phone || '')
  const [residingAddress, setResidingAddress] = useState(viewedProfile.residing_address || '')
  const [name, setName] = useState(viewedProfile.name)
  const [department, setDepartment] = useState(viewedProfile.department || '')
  const [location, setLocation] = useState(viewedProfile.location || '')
  const [managerId, setManagerId] = useState(viewedProfile.manager_id || 'NONE')
  const [dateOfJoining, setDateOfJoining] = useState(viewedProfile.date_of_joining || '')
  const [dateOfBirth, setDateOfBirth] = useState(viewedProfile.date_of_birth || '')
  const [nationality, setNationality] = useState(viewedProfile.nationality || '')
  const [gender, setGender] = useState(viewedProfile.gender || '')
  const [maritalStatus, setMaritalStatus] = useState(viewedProfile.marital_status || '')
  
  // Bank Details
  const [bankName, setBankName] = useState(viewedProfile.bank_name || '')
  const [accountNumber, setAccountNumber] = useState(viewedProfile.account_number || '')
  const [ifscCode, setIfscCode] = useState(viewedProfile.ifsc_code || '')
  const [panNo, setPanNo] = useState(viewedProfile.pan_no || '')
  const [uanNo, setUanNo] = useState(viewedProfile.uan_no || '')

  // --- Salary Config States (Admin Only) ---
  const [isEditingSalary, setIsEditingSalary] = useState(false)
  const [monthlyWage, setMonthlyWage] = useState(salaryConfig?.monthly_wage?.toString() || '0')
  const [workingDays, setWorkingDays] = useState(salaryConfig?.working_days_per_week?.toString() || '5')
  const [workingHours, setWorkingHours] = useState(salaryConfig?.working_hours_per_day?.toString() || '8')
  const [basicPct, setBasicPct] = useState(salaryConfig?.basic_salary_pct?.toString() || '50')
  const [hraPct, setHraPct] = useState(salaryConfig?.hra_pct?.toString() || '50')
  const [stdAllow, setStdAllow] = useState(salaryConfig?.standard_allowance?.toString() || '4167')
  const [perfPct, setPerfPct] = useState(salaryConfig?.performance_bonus_pct?.toString() || '8.33')
  const [ltaPctState, setLtaPctState] = useState(salaryConfig?.lta_pct?.toString() || '8.33')
  const [pfRate, setPfRate] = useState(salaryConfig?.pf_rate?.toString() || '12')
  const [profTax, setProfTax] = useState(salaryConfig?.professional_tax?.toString() || '200')

  // --- Security Tab (Change Password) States ---
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Split skills/certifications
  const skillItems = skills.filter(s => s.type === 'skill')
  const certItems = skills.filter(s => s.type === 'certification')

  // --- CALCULATE SALARY COMPONENTS DYNAMICALLY ---
  const wageVal = parseFloat(monthlyWage) || 0
  const basicVal = Math.round((wageVal * (parseFloat(basicPct) / 100)) * 100) / 100
  const hraVal = Math.round((basicVal * (parseFloat(hraPct) / 100)) * 100) / 100
  const stdAllowVal = parseFloat(stdAllow) || 0
  const perfBonusVal = Math.round((basicVal * (parseFloat(perfPct) / 100)) * 100) / 100
  const ltaVal = Math.round((basicVal * (parseFloat(ltaPctState) / 100)) * 100) / 100

  // Fixed Allowance = Remainder
  const fixedAllowanceVal = Math.max(
    0,
    Math.round((wageVal - (basicVal + hraVal + stdAllowVal + perfBonusVal + ltaVal)) * 100) / 100
  )

  // Deductions
  const employeePFVal = Math.round((basicVal * (parseFloat(pfRate) / 100)) * 100) / 100
  const professionalTaxVal = parseFloat(profTax) || 0
  
  // Net salary take-home
  const netTakeHome = Math.max(0, Math.round((wageVal - employeePFVal - professionalTaxVal) * 100) / 100)

  // Chart data for salary components
  const chartData = [
    { name: 'Basic Salary', value: basicVal, color: '#6366f1' },
    { name: 'HRA', value: hraVal, color: '#3b82f6' },
    { name: 'Standard Allowance', value: stdAllowVal, color: '#10b981' },
    { name: 'Performance Bonus', value: perfBonusVal, color: '#8b5cf6' },
    { name: 'LTA', value: ltaVal, color: '#a855f7' },
    { name: 'Fixed Allowance', value: fixedAllowanceVal, color: '#f59e0b' }
  ].filter(item => item.value > 0)

  // --- HANDLERS ---
  const handleSaveResume = () => {
    startTransition(async () => {
      const res = await updateProfileResume(viewedProfile.id, about, whatILove, interests)
      if (res.success) {
        setIsEditingResume(false)
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleAddSkill = async (type: 'skill' | 'certification') => {
    const nameVal = type === 'skill' ? newSkillName : newCertName
    if (!nameVal.trim()) {
      toast.error('Please enter a name first.')
      return
    }

    startTransition(async () => {
      let documentUrl: string | undefined = undefined

      if (type === 'certification' && certFile) {
        const formData = new FormData()
        formData.append('file', certFile)
        const uploadRes = await uploadCertificate(formData)
        if (uploadRes.success) {
          documentUrl = uploadRes.url
        } else {
          toast.error(`File upload failed: ${uploadRes.message}`)
          return
        }
      }

      const res = await addSkill(viewedProfile.id, nameVal.trim(), type, documentUrl)
      if (res.success) {
        if (type === 'skill') {
          setNewSkillName('')
        } else {
          setNewCertName('')
          setCertFile(null)
        }
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    setSkillToDelete({ id: skillId, name: skillName })
  }

  const handleSavePrivateInfo = () => {
    startTransition(async () => {
      const fields = {
        name, phone, residingAddress, department, location, managerId, dateOfJoining,
        dateOfBirth, nationality, gender, maritalStatus, bankName, accountNumber, ifscCode, panNo, uanNo
      }
      const res = await updatePrivateInfo(viewedProfile.id, fields)
      if (res.success) {
        setIsEditingPrivate(false)
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleSaveSalaryConfig = () => {
    startTransition(async () => {
      const fields = {
        monthlyWage, workingDaysPerWeek: workingDays, workingHoursPerDay: workingHours,
        basicSalaryPct: basicPct, hraPct, standardAllowance: stdAllow,
        performanceBonusPct: perfPct, ltaPct: ltaPctState, pfRate, professionalTax: profTax
      }
      const res = await updateSalaryConfig(viewedProfile.id, fields)
      if (res.success) {
        setIsEditingSalary(false)
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const res = await changePassword(newPassword)
      if (res.success) {
        setNewPassword('')
        setConfirmPassword('')
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    })
  }

  // Handle user uploaded profile picture
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      startTransition(async () => {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadAvatar(viewedProfile.id, formData)
        if (res.success) {
          toast.success('Profile picture updated successfully!')
          router.refresh()
        } else {
          toast.error(res.message)
        }
      })
    }
  }

  // Handle profile picture deletion
  const handleDeleteAvatar = () => {
    if (!canEditContact) return
    setIsAvatarDeleteOpen(true)
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. HEADER PROFILE CARD */}
      <Card className="glass border-slate-900 rounded-3xl relative overflow-hidden p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {isAdmin && !isOwner && (
          <div className="absolute top-6 right-6 z-20">
            <Button
              variant="outline"
              onClick={handleDeleteProfile}
              disabled={isPending}
              className="border-rose-900/50 hover:bg-rose-950/20 text-rose-400 hover:text-rose-350 text-xs px-3.5 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </>
              )}
            </Button>
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Picture with Bottom-Right Edit Button */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              {viewedProfile.avatar_url ? (
                <img src={viewedProfile.avatar_url} alt={viewedProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-indigo-400">
                  {viewedProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
            </div>
            
            {canEditContact && (
              <>
                <label 
                  className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl cursor-pointer shadow-lg border border-indigo-500/20 transition-all flex items-center justify-center z-20"
                  title="Upload Profile Picture"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadAvatar}
                    disabled={isPending}
                    className="hidden" 
                  />
                </label>
                {viewedProfile.avatar_url && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isPending}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl cursor-pointer shadow-lg border border-rose-500/20 transition-all flex items-center justify-center z-20 animate-in fade-in zoom-in duration-300"
                    title="Remove Profile Picture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Details Column */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-100">
                {viewedProfile.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-medium text-slate-400 mt-1">
                {viewedProfile.role !== 'Admin' && (
                  <>
                    <span className="bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded-full text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                      {viewedProfile.login_id || 'ID Pending'}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{viewedProfile.role === 'Admin' ? 'HR Administrator' : 'Staff Employee'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-900 text-xs font-semibold text-slate-450">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Building className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-300">{viewedProfile.department || 'Unassigned Department'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-300">{viewedProfile.location || 'Unassigned Location'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-350 truncate">{viewedProfile.email}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. TABS CONTAINER */}
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-900 rounded-2xl w-fit mb-6">
          <TabsTrigger value="resume" className="rounded-xl text-xs font-semibold py-2 px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Resume
          </TabsTrigger>
          <TabsTrigger value="private" className="rounded-xl text-xs font-semibold py-2 px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Private Info
          </TabsTrigger>
          {isAdmin && viewedProfile.role !== 'Admin' && (
            <TabsTrigger value="salary" className="rounded-xl text-xs font-semibold py-2 px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Salary Info
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="security" className="rounded-xl text-xs font-semibold py-2 px-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Security
            </TabsTrigger>
          )}
        </TabsList>

        {/* =============================================================
            TAB 1: RESUME (About, What I Love, Interests, Skills, Certs)
            ============================================================= */}
        <TabsContent value="resume" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns (text highlights) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-slate-900 rounded-2xl p-5 relative group">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-heading font-black text-sm text-slate-100">About Me</h3>
                {canEditContact && !isEditingResume && (
                  <button 
                    onClick={() => setIsEditingResume(true)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingResume ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Write an introduction</Label>
                    <TextareaInput 
                      value={about}
                      onChange={(e: any) => setAbout(e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">What I love about my job</Label>
                    <TextareaInput 
                      value={whatILove}
                      onChange={(e: any) => setWhatILove(e.target.value)}
                      placeholder="What excites you about your position?"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">My interests and hobbies</Label>
                    <TextareaInput 
                      value={interests}
                      onChange={(e: any) => setInterests(e.target.value)}
                      placeholder="What do you do outside work?"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingResume(false)} 
                      disabled={isPending}
                      className="border-slate-800 text-xs rounded-xl h-8 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveResume} 
                      disabled={isPending}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl h-8 flex items-center gap-1 cursor-pointer"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-xs leading-relaxed text-slate-350">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Introduction</span>
                    <p className="whitespace-pre-line bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60 italic">
                      {viewedProfile.about || 'No introduction shared yet.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">What I love about my job</span>
                    <p className="whitespace-pre-line bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60">
                      {viewedProfile.what_i_love || 'No workplace reflections shared yet.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Interests & Hobbies</span>
                    <p className="whitespace-pre-line bg-slate-950/20 p-3.5 rounded-xl border border-slate-900/60">
                      {viewedProfile.interests || 'No interests or hobbies shared yet.'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column (Skills & Certifications list) */}
          <div className="space-y-6">
            
            {/* Skills Card */}
            <Card className="glass border-slate-900 rounded-2xl p-5">
              <h3 className="font-heading font-black text-sm text-slate-100 mb-3 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Skills</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]">
                {skillItems.length === 0 ? (
                  <span className="text-slate-500 text-xs italic">No skills added yet.</span>
                ) : (
                  skillItems.map(skill => (
                    <span 
                      key={skill.id} 
                      className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 pl-3 pr-2 py-1 rounded-lg text-xs font-medium group/tag"
                    >
                      <span>{skill.name}</span>
                      {canEditContact && (
                        <button 
                          onClick={() => handleDeleteSkill(skill.id, skill.name)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-red-400 focus:outline-none transition-colors p-0.5 rounded-md hover:bg-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>

              {canEditContact && (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Add new skill..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    disabled={isPending}
                    className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-[34px]"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill('skill') }}
                  />
                  <Button 
                    onClick={() => handleAddSkill('skill')}
                    disabled={isPending}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 h-[34px] w-[34px] shrink-0 rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Certifications Card */}
            <Card className="glass border-slate-900 rounded-2xl p-5">
              <h3 className="font-heading font-black text-sm text-slate-100 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Certifications</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]">
                {certItems.length === 0 ? (
                  <span className="text-slate-500 text-xs italic">No certifications added yet.</span>
                ) : (
                  certItems.map(cert => (
                    <span 
                      key={cert.id} 
                      className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 pl-3 pr-2 py-1 rounded-lg text-xs font-medium group/tag"
                    >
                      <span>{cert.name}</span>
                      {cert.document_url && (
                        <a 
                          href={cert.document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center justify-center"
                          title="View Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {canEditContact && (
                        <button 
                          onClick={() => handleDeleteSkill(cert.id, cert.name)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-red-455 focus:outline-none transition-colors p-0.5 rounded-md hover:bg-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>

              {canEditContact && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Add certification..."
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-650 rounded-xl text-xs h-[34px]"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill('certification') }}
                    />
                    <Button 
                      onClick={() => handleAddSkill('certification')}
                      disabled={isPending}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 h-[34px] w-[34px] shrink-0 rounded-xl flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-955/20 border border-dashed border-slate-800 p-2 rounded-xl">
                    <label className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-indigo-400 flex items-center gap-1.5 w-full">
                      <span className="bg-slate-905 border border-slate-800 px-2 py-1 rounded-md text-[9px] uppercase tracking-wider text-slate-300">Choose File</span>
                      <span className="truncate max-w-[200px] font-normal">
                        {certFile ? certFile.name : 'Optional: Upload certificate document (PDF, PNG, JPG)'}
                      </span>
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCertFile(e.target.files[0])
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {certFile && (
                      <button 
                        type="button" 
                        onClick={() => setCertFile(null)} 
                        className="text-slate-500 hover:text-rose-450 text-[10px] uppercase font-bold cursor-pointer shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>

          </div>
        </TabsContent>

        {/* =============================================================
            TAB 2: PRIVATE INFO (Demographics & Bank details)
            ============================================================= */}
        <TabsContent value="private">
          <Card className="glass border-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="font-heading font-black text-sm text-slate-100">Private & Corporate Information</h3>
              {canEditContact && !isEditingPrivate && (
                <Button 
                  onClick={() => setIsEditingPrivate(true)}
                  variant="outline"
                  className="border-slate-800 text-xs rounded-xl h-8 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Info</span>
                </Button>
              )}
            </div>

            <div className="space-y-8">
              {/* Profile details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                
                {/* Full name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Full Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Work Email</Label>
                  <Input
                    type="email"
                    value={viewedProfile.email}
                    disabled
                    className="bg-slate-950/40 border-slate-850 opacity-60 text-slate-350 rounded-xl text-xs h-9 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Phone Number</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditingPrivate}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Department</Label>
                  <Input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Location</Label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Date of Joining */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Date of Joining</Label>
                  <Input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>
                {/* Manager */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Manager</Label>
                  {isEditingPrivate && canEditAll ? (
                    <select
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full bg-slate-955/60 border border-slate-800 text-slate-100 text-xs rounded-xl h-9 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(156, 163, 175)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem'
                      }}
                    >
                      <option value="NONE" className="bg-slate-900 text-slate-200">No Manager</option>
                      {managersList.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type="text"
                      value={managersList.find(m => m.id === viewedProfile.manager_id)?.name || 'None'}
                      disabled
                      className="bg-slate-955/40 border-slate-850 opacity-80 text-slate-300 rounded-xl text-xs h-9 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Date of Birth</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Nationality */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Nationality</Label>
                  <Input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    disabled={!isEditingPrivate || !canEditAll}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gender</Label>
                  {isEditingPrivate && canEditAll ? (
                    <Select value={gender} onValueChange={(val) => setGender(val || '')}>
                      <SelectTrigger className="bg-slate-955/60 border-slate-800 text-slate-100 text-xs rounded-xl h-9">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        <SelectItem value="Male" className="text-xs">Male</SelectItem>
                        <SelectItem value="Female" className="text-xs">Female</SelectItem>
                        <SelectItem value="Other" className="text-xs">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      value={gender || 'Unspecified'}
                      disabled
                      className="bg-slate-955/40 border-slate-850 opacity-80 text-slate-300 rounded-xl text-xs h-9 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Marital Status */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Marital Status</Label>
                  {isEditingPrivate && canEditAll ? (
                    <Select value={maritalStatus} onValueChange={(val) => setMaritalStatus(val || '')}>
                      <SelectTrigger className="bg-slate-955/60 border-slate-800 text-slate-100 text-xs rounded-xl h-9">
                        <SelectValue placeholder="Marital status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                        <SelectItem value="Single" className="text-xs">Single</SelectItem>
                        <SelectItem value="Married" className="text-xs">Married</SelectItem>
                        <SelectItem value="Divorced" className="text-xs">Divorced</SelectItem>
                        <SelectItem value="Widowed" className="text-xs">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      value={maritalStatus || 'Unspecified'}
                      disabled
                      className="bg-slate-955/40 border-slate-850 opacity-80 text-slate-300 rounded-xl text-xs h-9 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Residing Address (Occupies 2 columns on larger screens) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Residing Address</Label>
                  <Input
                    type="text"
                    value={residingAddress}
                    onChange={(e) => setResidingAddress(e.target.value)}
                    disabled={!isEditingPrivate}
                    className="bg-slate-950/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                  />
                </div>

              </div>

              {/* Bank Details section */}
              <div className="border-t border-slate-900 pt-6 space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Financial & Bank Account Details</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                  {/* Bank name */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Bank Name</Label>
                    <Input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      disabled={!isEditingPrivate || !canEditAll}
                      className="bg-slate-955/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                    />
                  </div>
                  {/* Account number */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Account Number</Label>
                    <Input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      disabled={!isEditingPrivate || !canEditAll}
                      className="bg-slate-955/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                    />
                  </div>
                  {/* IFSC Code */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">IFSC Code</Label>
                    <Input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      disabled={!isEditingPrivate || !canEditAll}
                      className="bg-slate-955/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                    />
                  </div>
                  {/* PAN NO */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">PAN Number</Label>
                    <Input
                      type="text"
                      value={panNo}
                      onChange={(e) => setPanNo(e.target.value)}
                      disabled={!isEditingPrivate || !canEditAll}
                      className="bg-slate-955/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9 uppercase"
                    />
                  </div>
                  {/* UAN NO */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">UAN (PF Number)</Label>
                    <Input
                      type="text"
                      value={uanNo}
                      onChange={(e) => setUanNo(e.target.value)}
                      disabled={!isEditingPrivate || !canEditAll}
                      className="bg-slate-955/60 border-slate-800 disabled:opacity-85 text-slate-100 rounded-xl text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Save Cancel Options */}
              {isEditingPrivate && (
                <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingPrivate(false)} 
                    disabled={isPending}
                    className="border-slate-800 text-xs rounded-xl h-8 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSavePrivateInfo} 
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl h-8 flex items-center gap-1 cursor-pointer"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Details</span>
                  </Button>
                </div>
              )}

            </div>
          </Card>
        </TabsContent>

        {/* =============================================================
            TAB 3: SALARY INFO (Admin Only)
            ============================================================= */}
        {isAdmin && viewedProfile.role !== 'Admin' && (
          <TabsContent value="salary" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left columns: salary parameters & breakdowns */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass border-slate-900 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="font-heading font-black text-sm text-slate-100 flex items-center gap-1.5">
                    <DollarSign className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Monthly Wage Breakdowns</span>
                  </h3>
                  {canEditAll && !isEditingSalary && (
                    <Button 
                      onClick={() => setIsEditingSalary(true)}
                      variant="outline"
                      className="border-slate-800 text-xs rounded-xl h-8 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Update Wage</span>
                    </Button>
                  )}
                </div>

                {isEditingSalary ? (
                  /* Edit salary parameter fields */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-indigo-400 uppercase">Monthly Wage (INR)</Label>
                        <Input
                          type="number"
                          value={monthlyWage}
                          onChange={(e) => setMonthlyWage(e.target.value)}
                          className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Days in Week</Label>
                        <Input
                          type="number"
                          value={workingDays}
                          onChange={(e) => setWorkingDays(e.target.value)}
                          className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Daily Work Hours</Label>
                        <Input
                          type="number"
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-900 pt-5 space-y-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Configure Component Percentages</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">Basic Salary (% of Wage)</Label>
                          <Input
                            type="number"
                            value={basicPct}
                            onChange={(e) => setBasicPct(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">HRA (% of Basic)</Label>
                          <Input
                            type="number"
                            value={hraPct}
                            onChange={(e) => setHraPct(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">Standard Allowance (Fixed)</Label>
                          <Input
                            type="number"
                            value={stdAllow}
                            onChange={(e) => setStdAllow(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">Performance Bonus (% of Basic)</Label>
                          <Input
                            type="number"
                            value={perfPct}
                            onChange={(e) => setPerfPct(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">LTA (% of Basic)</Label>
                          <Input
                            type="number"
                            value={ltaPctState}
                            onChange={(e) => setLtaPctState(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-450 uppercase">PF Rate (% of Basic)</Label>
                          <Input
                            type="number"
                            value={pfRate}
                            onChange={(e) => setPfRate(e.target.value)}
                            className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingSalary(false)} 
                        disabled={isPending}
                        className="border-slate-800 text-xs rounded-xl h-8 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveSalaryConfig} 
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl h-8 flex items-center gap-1 cursor-pointer"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Calculate & Save</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display salary components structure */
                  <div className="space-y-6 text-xs">
                    
                    {/* Basic details summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 border-b border-slate-900 pb-5 text-slate-350">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Gross Monthly Wage</span>
                        <span className="text-xl font-black text-slate-200 mt-1 block">₹{wageVal.toLocaleString()} / month</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Gross Yearly Salary</span>
                        <span className="text-xl font-black text-slate-200 mt-1 block">₹{(wageVal * 12).toLocaleString()} / year</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Working Schedule</span>
                        <span className="text-sm font-bold text-slate-300 mt-1.5 block">
                          {workingDays} days/week • {workingHours} hrs/day
                        </span>
                      </div>
                    </div>

                    {/* Salary Components lists */}
                    <div className="space-y-4 pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Earnings Components Breakdown</h4>
                      <div className="divide-y divide-slate-900/60 bg-slate-950/20 rounded-2xl border border-slate-900 p-4 space-y-3.5 divide-none">
                        
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-300">
                          <div className="flex flex-col gap-0.5">
                            <span>Basic Salary</span>
                            <span className="text-[9px] text-slate-550 font-medium">({basicPct}% of Monthly Wage)</span>
                          </div>
                          <span>₹{basicVal.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-305">
                          <div className="flex flex-col gap-0.5">
                            <span>House Rent Allowance (HRA)</span>
                            <span className="text-[9px] text-slate-550 font-medium">({hraPct}% of Basic Salary)</span>
                          </div>
                          <span>₹{hraVal.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-305">
                          <div className="flex flex-col gap-0.5">
                            <span>Standard Allowance</span>
                            <span className="text-[9px] text-slate-550 font-medium">(Fixed corporate allowance)</span>
                          </div>
                          <span>₹{stdAllowVal.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-305">
                          <div className="flex flex-col gap-0.5">
                            <span>Performance Bonus</span>
                            <span className="text-[9px] text-slate-550 font-medium">({perfPct}% of Basic Salary)</span>
                          </div>
                          <span>₹{perfBonusVal.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-305">
                          <div className="flex flex-col gap-0.5">
                            <span>Leave Travel Allowance (LTA)</span>
                            <span className="text-[9px] text-slate-550 font-medium">({ltaPctState}% of Basic Salary)</span>
                          </div>
                          <span>₹{ltaVal.toLocaleString()}</span>
                        </div>

                        {/* Remainder balancing component */}
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-305 border-t border-slate-900 pt-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span>Fixed / Special Allowance</span>
                            <span className="text-[9px] text-slate-550 font-medium">(Calculated balancing remainder)</span>
                          </div>
                          <span className="text-indigo-400">₹{fixedAllowanceVal.toLocaleString()}</span>
                        </div>

                      </div>
                    </div>

                    {/* Deductions breakdown */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deductions & Contributions</h4>
                      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-350">
                          <div className="flex flex-col gap-0.5">
                            <span>Employee PF Contribution</span>
                            <span className="text-[9px] text-slate-550 font-medium">({pfRate}% of Basic - Deducted)</span>
                          </div>
                          <span className="text-red-400">-₹{employeePFVal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-350">
                          <div className="flex flex-col gap-0.5">
                            <span>Professional Tax</span>
                            <span className="text-[9px] text-slate-550 font-medium">(Fixed corporate deduction)</span>
                          </div>
                          <span className="text-red-400">-₹{professionalTaxVal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Card>
            </div>

            {/* Right side panel: Recharts visual pie chart and Net Take Home display */}
            <div className="space-y-6">
              
              {/* Take home display */}
              <Card className="glass border-slate-900 bg-indigo-950/5 rounded-2xl p-5 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Take-home Net Salary</span>
                <div className="text-3xl font-black text-indigo-400 mt-2 font-heading">
                  ₹{netTakeHome.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-450 mt-1 block">per month (after PF and PT taxes)</span>
              </Card>

              {/* Recharts Pie Chart */}
              <Card className="glass border-slate-900 rounded-2xl p-5 flex flex-col items-center">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 self-start">Component Weight ratios</h4>
                
                {chartData.length > 0 ? (
                  <div className="w-full h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `₹${Number(value || 0).toLocaleString()}`}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Gross</span>
                      <span className="text-sm font-black text-slate-200">₹{wageVal.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-slate-500 text-xs italic">Specify wage values to load weight chart.</div>
                )}

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2 border-t border-slate-900 pt-3 text-[10px] text-slate-450 font-medium">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </TabsContent>
        )}

        {/* =============================================================
            TAB 4: SECURITY (Change Password - Owner Only)
            ============================================================= */}
        {isOwner && (
          <TabsContent value="security" className="max-w-md">
            <Card className="glass border-slate-900 rounded-2xl p-6">
              <h3 className="font-heading font-black text-sm text-slate-100 mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Change Account Password</span>
              </h3>
              <p className="text-[11px] text-slate-450 mb-5">
                Set a strong password that you do not use elsewhere. Minimum 8 characters.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPass" className="text-slate-350 text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPass"
                      type={showNewPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9 pr-10 w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPass" className="text-slate-350 text-xs font-semibold">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPass"
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isPending}
                      className="bg-slate-955/60 border-slate-800 text-slate-100 rounded-xl text-xs h-9 pr-10 w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition-all w-full flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Change Password</span>
                </Button>
              </form>
            </Card>
          </TabsContent>
        )}

      </Tabs>

      {/* Custom Confirm Deletion Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-[380px] bg-slate-900 border-slate-850 text-slate-200 rounded-3xl p-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          
          {/* Circular Red Trash Icon Container */}
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2 animate-pulse">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-heading font-black text-slate-100">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-455 text-xs font-semibold">
              Do you want to delete this user?
            </DialogDescription>
          </DialogHeader>

          {/* User Name Highlight */}
          <div className="text-sm font-bold text-slate-200 my-4 bg-slate-950/40 border border-slate-850/80 px-4 py-2 rounded-xl w-full truncate">
            &quot;{viewedProfile.name}&quot;
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false)
              }}
              className="border-slate-800 hover:bg-slate-850 text-xs font-bold rounded-xl h-10 cursor-pointer text-slate-400 uppercase tracking-wider"
            >
              No
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl h-10 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Yes</span>
              )}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* Custom Confirm Avatar Deletion Dialog */}
      <Dialog open={isAvatarDeleteOpen} onOpenChange={setIsAvatarDeleteOpen}>
        <DialogContent className="max-w-[380px] bg-slate-900 border-slate-855 text-slate-200 rounded-3xl p-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2 animate-pulse">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-heading font-black text-slate-100">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-455 text-xs font-semibold">
              Do you want to delete this profile picture?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm font-bold text-slate-200 my-4 bg-slate-950/40 border border-slate-850/80 px-4 py-2 rounded-xl w-full truncate">
            &quot;{viewedProfile.name}&apos;s Photo&quot;
          </div>
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={() => setIsAvatarDeleteOpen(false)}
              className="border-slate-800 hover:bg-slate-850 text-xs font-bold rounded-xl h-10 cursor-pointer text-slate-400 uppercase tracking-wider"
            >
              No
            </Button>
            <Button
              onClick={confirmDeleteAvatar}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl h-10 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Yes</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Confirm Skill Deletion Dialog */}
      <Dialog open={!!skillToDelete} onOpenChange={(open) => { if (!open) setSkillToDelete(null) }}>
        <DialogContent className="max-w-[380px] bg-slate-900 border-slate-850 text-slate-200 rounded-3xl p-6 flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2 animate-pulse">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-heading font-black text-slate-100">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-455 text-xs font-semibold">
              Do you want to delete this item?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm font-bold text-slate-200 my-4 bg-slate-950/40 border border-slate-850/80 px-4 py-2 rounded-xl w-full truncate">
            &quot;{skillToDelete?.name}&quot;
          </div>
          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={() => setSkillToDelete(null)}
              className="border-slate-800 hover:bg-slate-855 text-xs font-bold rounded-xl h-10 cursor-pointer text-slate-400 uppercase tracking-wider"
            >
              No
            </Button>
            <Button
              onClick={confirmDeleteSkill}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl h-10 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Yes</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
