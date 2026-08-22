-- Dayflow HRMS Database Schema
-- Run this script in the Supabase SQL Editor

-- -------------------------------------------------------------
-- CLEANUP EXISTING TABLES (Uncomment if executing a reset)
-- -------------------------------------------------------------
-- DROP TABLE IF EXISTS payslips CASCADE;
-- DROP TABLE IF EXISTS time_off_requests CASCADE;
-- DROP TABLE IF EXISTS time_off_allocations CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS salary_configs CASCADE;
-- DROP TABLE IF EXISTS skills CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;

-- -------------------------------------------------------------
-- 1. COMPANIES TABLE
-- -------------------------------------------------------------
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 2. PROFILES TABLE (Extends auth.users)
-- -------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    login_id TEXT UNIQUE, -- Custom generated employee ID (e.g. OIJODO20260001)
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee')),
    avatar_url TEXT,
    department TEXT,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    location TEXT,
    date_of_joining DATE DEFAULT CURRENT_DATE,
    date_of_birth DATE,
    residing_address TEXT,
    nationality TEXT,
    gender TEXT,
    marital_status TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    pan_no TEXT,
    uan_no TEXT,
    about TEXT,
    what_i_love TEXT,
    interests TEXT,
    is_activated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for lookup speed
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_login_id ON profiles(login_id);

-- -------------------------------------------------------------
-- 3. SKILLS TABLE
-- -------------------------------------------------------------
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('skill', 'certification')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_profile ON skills(profile_id);

-- -------------------------------------------------------------
-- 4. SALARY CONFIGURATIONS TABLE (Only visible to Admin)
-- -------------------------------------------------------------
CREATE TABLE salary_configs (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    monthly_wage NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    working_days_per_week INTEGER NOT NULL DEFAULT 5,
    working_hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    basic_salary_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- % of monthly_wage
    hra_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00,           -- % of basic_salary
    standard_allowance NUMERIC(12, 2) NOT NULL DEFAULT 4167.00, -- Fixed amount
    performance_bonus_pct NUMERIC(5, 2) NOT NULL DEFAULT 8.33, -- % of basic_salary
    lta_pct NUMERIC(5, 2) NOT NULL DEFAULT 8.33,               -- % of basic_salary
    pf_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,              -- % of basic_salary (Employee PF contribution)
    professional_tax NUMERIC(12, 2) NOT NULL DEFAULT 200.00,    -- Fixed tax deduction
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 5. ATTENDANCE TABLE
-- -------------------------------------------------------------
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    work_hours NUMERIC(5, 2),  -- Total work hours in decimal (computed on check-out)
    extra_hours NUMERIC(5, 2), -- Overtime hours (computed as work_hours - 8)
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, date)
);

CREATE INDEX idx_attendance_profile_date ON attendance(profile_id, date);

-- -------------------------------------------------------------
-- 6. TIME OFF ALLOCATIONS (Leave Balances)
-- -------------------------------------------------------------
CREATE TABLE time_off_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Paid time off', 'Sick Leave', 'Unpaid Leaves')),
    total_days NUMERIC(5, 2) NOT NULL,
    used_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    UNIQUE(profile_id, leave_type)
);

-- -------------------------------------------------------------
-- 7. TIME OFF REQUESTS
-- -------------------------------------------------------------
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Paid time off', 'Sick Leave', 'Unpaid Leaves')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    num_days NUMERIC(5, 2) NOT NULL,
    remarks TEXT,
    attachment_url TEXT, -- For upload certificates
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_off_requests_profile ON time_off_requests(profile_id);

-- -------------------------------------------------------------
-- 8. PAYSLIPS TABLE
-- -------------------------------------------------------------
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    monthly_wage NUMERIC(12, 2) NOT NULL,
    basic NUMERIC(12, 2) NOT NULL,
    hra NUMERIC(12, 2) NOT NULL,
    standard_allowance NUMERIC(12, 2) NOT NULL,
    performance_bonus NUMERIC(12, 2) NOT NULL,
    lta NUMERIC(12, 2) NOT NULL,
    fixed_allowance NUMERIC(12, 2) NOT NULL,
    employee_pf NUMERIC(12, 2) NOT NULL,
    professional_tax NUMERIC(12, 2) NOT NULL,
    unpaid_leave_deductions NUMERIC(12, 2) NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    payable_days NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, month, year)
);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Help functions or RLS Policy Helpers
-- User Metadata Check: 
-- Company ID: ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)
-- User Role:  (auth.jwt() -> 'user_metadata' ->> 'role')

-- Companies Policies
CREATE POLICY "Users can read own company" ON companies 
    FOR SELECT USING (id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid));

CREATE POLICY "Admins can update company" ON companies 
    FOR UPDATE USING (id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid) AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Profiles Policies
CREATE POLICY "Users can view profiles in company" ON profiles 
    FOR SELECT USING (company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid));

CREATE POLICY "Admins can insert profiles" ON profiles 
    FOR INSERT WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

CREATE POLICY "Users can update own details, Admins can update all" ON profiles 
    FOR UPDATE USING (
        id = auth.uid() OR 
        (company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid) AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin')
    );

CREATE POLICY "Admins can delete profiles" ON profiles 
    FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Skills Policies
CREATE POLICY "Users can select skills of colleagues" ON skills 
    FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE company_id = ((auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid)));

CREATE POLICY "Users can manage own skills, Admins can manage all" ON skills 
    FOR ALL USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

-- Salary Configs Policies (Admin Only)
CREATE POLICY "Admins can manage salary configs" ON salary_configs 
    FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Attendance Policies
CREATE POLICY "Users can select own attendance, Admins can select all" ON attendance 
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Users can insert own attendance, Admins can insert all" ON attendance 
    FOR INSERT WITH CHECK (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Users can update own attendance, Admins can update all" ON attendance 
    FOR UPDATE USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

-- Time Off Allocations Policies
CREATE POLICY "Users can select own allocations, Admins can select all" ON time_off_allocations 
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Admins can manage allocations" ON time_off_allocations 
    FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Time Off Requests Policies
CREATE POLICY "Users can select own requests, Admins can select all" ON time_off_requests 
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Users can submit requests" ON time_off_requests 
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update pending requests, Admins can update all" ON time_off_requests 
    FOR UPDATE USING (
        (profile_id = auth.uid() AND status = 'Pending') OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Users can delete pending requests, Admins can delete all" ON time_off_requests 
    FOR DELETE USING (
        (profile_id = auth.uid() AND status = 'Pending') OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

-- Payslips Policies
CREATE POLICY "Users can select own payslips, Admins can select all" ON payslips 
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
    );

CREATE POLICY "Admins can manage payslips" ON payslips 
    FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- -------------------------------------------------------------
-- STORAGE BUCKETS SETUP (Instructions for Supabase Storage API)
-- -------------------------------------------------------------
-- Make sure to create the following buckets with Public access:
-- 1. "company-logos"
-- 2. "avatars"
-- 3. "leave-attachments"
