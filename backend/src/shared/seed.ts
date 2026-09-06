import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { pool, db, closeDb } from './db';
import * as schema from '../db/schema';
import { passwordSchema } from '../modules/auth/auth.validators';

// --- Plausible Indian Corporate Profiles Data ---
const FIRST_NAMES_MALE = [
  'Aarav', 'Rohan', 'Aditya', 'Vikram', 'Kabir', 'Nikhil', 'Kunal', 'Sameer',
  'Arjun', 'Pranav', 'Siddharth', 'Varun', 'Rahul', 'Aniket', 'Kartik', 'Dev',
  'Tanmay', 'Gaurav', 'Yash', 'Aman', 'Alok', 'Harsh', 'Rishabh', 'Vivek',
  'Tarun', 'Manish', 'Chetan', 'Sanjay', 'Mohit', 'Deepak', 'Rakesh', 'Vishal',
  'Suresh', 'Amit', 'Nitin', 'Abhishek', 'Karan', 'Rajesh', 'Sachin', 'Pankaj',
  'Mayank', 'Hemant', 'Sunil', 'Anil', 'Girish', 'Dinesh', 'Ashish', 'Bhavesh',
  'Ravi', 'Manoj', 'Vijay', 'Sumit', 'Prateek', 'Harish', 'Lokesh', 'Neeraj',
  'Akash', 'Suraj', 'Ajay', 'Vikas'
];

const FIRST_NAMES_FEMALE = [
  'Nisha', 'Maya', 'Priya', 'Ananya', 'Sneha', 'Pooja', 'Neha', 'Ritu',
  'Kavita', 'Shreya', 'Divya', 'Meera', 'Riya', 'Sunita', 'Tanvi', 'Radhika',
  'Swati', 'Deepa', 'Akanksha', 'Ishita', 'Kriti', 'Sonali', 'Aarti', 'Payal',
  'Simran', 'Bhavna', 'Shikha', 'Vandana', 'Pallavi', 'Namrata', 'Rashmi', 'Jyoti',
  'Anjali', 'Komal', 'Suman', 'Garima', 'Aparna', 'Monika', 'Preeti', 'Swetha',
  'Nandini', 'Shruti', 'Anuradha', 'Anita', 'Bhumika', 'Richa', 'Nidhi', 'Smriti',
  'Reena', 'Sangeeta', 'Priyanka', 'Chitra', 'Madhuri', 'Archana', 'Divyanshi', 'Meenakshi',
  'Tanushree', 'Isha', 'Sapna', 'Varsha'
];

const LAST_NAMES = [
  'Rao', 'Shah', 'Mehta', 'Patel', 'Sharma', 'Verma', 'Gupta', 'Iyer',
  'Nair', 'Reddy', 'Kulkarni', 'Joshi', 'Deshmukh', 'Bhat', 'Singhania', 'Bansal',
  'Agarwal', 'Chopra', 'Sengupta', 'Mukherjee', 'Chatterjee', 'Bose', 'Das', 'Saxena',
  'Mathur', 'Mishra', 'Pandey', 'Tiwari', 'Shukla', 'Bhattacharya', 'Pillai', 'Menon',
  'Nambiar', 'Hegde', 'Shetty', 'Kamath', 'Bhardwaj', 'Malhotra', 'Kapoor', 'Khanna',
  'Goyal', 'Mittal', 'Jain', 'Bhatia', 'Chawla', 'Sood', 'Chauhan', 'Thakur',
  'Yadav', 'Dubey', 'Tripathi', 'Goswami', 'Acharya', 'Prasad', 'Ghosh', 'Dutta',
  'Venkatesh', 'Subramanian', 'Krishnan', 'Balakrishnan', 'Ranganathan', 'Sundaram', 'Naidu', 'Choudhury'
];

const LOCATIONS = [
  'Bengaluru Tech Hub',
  'Mumbai Corporate HQ',
  'Pune Engineering Center',
  'Delhi NCR Office',
  'Hyderabad Technology Campus',
  'Chennai Innovation Lab',
  'Remote (India)',
];

const BANKS = [
  { name: 'HDFC Bank', ifsc: 'HDFC0001234' },
  { name: 'ICICI Bank', ifsc: 'ICIC0000543' },
  { name: 'State Bank of India', ifsc: 'SBIN0004521' },
  { name: 'Axis Bank', ifsc: 'UTIB0000892' },
  { name: 'Kotak Mahindra Bank', ifsc: 'KKBK0001456' },
];

const LEAVE_REASONS = [
  'Attending family wedding ceremony in hometown',
  'Viral fever and prescribed medical rest by doctor',
  'Annual summer family vacation trip',
  'Urgent personal banking and domestic registration work',
  'Severe dental issue requiring surgical extraction',
  'Accompanying aging parents for scheduled hospital health checkup',
  'Sister graduation convocation ceremony',
  'Relocating to a new residence apartment over the weekend',
  'Attending tech developer conference and leadership symposium',
  'Child school admission interviews and documentation',
  'Resting due to acute seasonal allergic conjunctivitis',
  'Personal reflection and mental wellness recharge day',
  'Attending housewarming ceremony (Griha Pravesh)',
  'Renewing passport and visa appointment at embassy center',
];

export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.info('🌱 Starting PeoplePay360 database seed with 100-200 entries per operational table...');

    // 1. Ensure table structure & clean previous data
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Main Headquarters';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20);
      ALTER TABLE IF EXISTS "jobPositions" RENAME TO job_positions;

      CREATE TABLE IF NOT EXISTS company_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        code VARCHAR(60) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL DEFAULT '1.0',
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        is_mandatory BOOLEAN NOT NULL DEFAULT true,
        effective_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS policy_acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID NOT NULL REFERENCES company_policies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        policy_version VARCHAR(20) NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(50),
        user_agent TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS policy_user_version_idx
        ON policy_acceptances (policy_id, user_id, policy_version);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        actor_name VARCHAR(150) NOT NULL DEFAULT 'System Admin',
        action VARCHAR(60) NOT NULL,
        entity_type VARCHAR(50) NOT NULL DEFAULT 'user',
        entity_id VARCHAR(100),
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      TRUNCATE TABLE
        policy_acceptances,
        audit_logs,
        payslip_lines,
        payslips,
        payruns,
        time_off_requests,
        time_off_allocations,
        time_off_types,
        fingerprint,
        attendance,
        contracts,
        employees,
        users,
        job_positions,
        departments,
        working_schedule_lines,
        working_schedules,
        salary_rules,
        salary_structures,
        company_policies
      CASCADE;
    `);

    // Add unique constraint on employee_code if not already present
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'employees_employee_code_unique'
        ) THEN
          ALTER TABLE employees ADD CONSTRAINT employees_employee_code_unique UNIQUE (employee_code);
        END IF;
      END $$;
    `);

    // Backfill employee_code for any existing employees that don't have one
    const uncodedRows = await client.query(
      `SELECT id FROM employees WHERE employee_code IS NULL ORDER BY created_at ASC`
    );
    if (uncodedRows.rows.length > 0) {
      const maxCodeResult = await client.query(
        `SELECT employee_code FROM employees WHERE employee_code IS NOT NULL ORDER BY employee_code DESC LIMIT 1`
      );
      let nextNum = 1;
      if (maxCodeResult.rows.length > 0 && maxCodeResult.rows[0].employee_code) {
        nextNum = parseInt(maxCodeResult.rows[0].employee_code.replace(/^EMP-/, ''), 10) + 1;
      }
      for (const row of uncodedRows.rows) {
        const code = `EMP-${String(nextNum).padStart(3, '0')}`;
        await client.query(`UPDATE employees SET employee_code = $1 WHERE id = $2`, [code, row.id]);
        nextNum++;
      }
      console.info(`✅ Backfilled employee_code for ${uncodedRows.rows.length} employees`);
    }

    // 2. Setup Password Hashes
    const adminRawPassword = 'Admin@123';
    const staffRawPassword = 'Staff@123';
    passwordSchema.parse(adminRawPassword);
    passwordSchema.parse(staffRawPassword);

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(adminRawPassword, salt);
    const staffPasswordHash = await bcrypt.hash(staffRawPassword, salt);

    // 3. Seed Departments (12 realistic departments)
    const departmentsData = [
      { name: 'Executive Leadership' },
      { name: 'Product Management' },
      { name: 'Frontend Engineering' },
      { name: 'Backend & Core Systems' },
      { name: 'Mobile Engineering' },
      { name: 'Cloud Infrastructure & SRE' },
      { name: 'Quality Engineering & Automation' },
      { name: 'Human Resources & People Ops' },
      { name: 'Payroll & Total Rewards' },
      { name: 'Talent Acquisition' },
      { name: 'Enterprise Sales & Partnerships' },
      { name: 'Finance, Legal & Governance' },
    ];

    const insertedDepts = await db.insert(schema.departments).values(departmentsData).returning();
    const deptMap: Record<string, string> = {};
    for (const d of insertedDepts) {
      deptMap[d.name] = d.id;
    }
    console.info(`✅ Seeded ${insertedDepts.length} departments`);

    // 4. Seed Job Positions (30 realistic titles mapped to departments)
    const jobPositionsData = [
      { title: 'Chief Executive Officer', departmentId: deptMap['Executive Leadership'] },
      { title: 'Chief Technology Officer', departmentId: deptMap['Executive Leadership'] },
      { title: 'VP of Engineering', departmentId: deptMap['Backend & Core Systems'] },
      { title: 'Director of Product', departmentId: deptMap['Product Management'] },
      { title: 'Lead Product Manager', departmentId: deptMap['Product Management'] },
      { title: 'Senior Product Manager', departmentId: deptMap['Product Management'] },
      { title: 'Associate Product Manager', departmentId: deptMap['Product Management'] },
      { title: 'Staff Frontend Engineer', departmentId: deptMap['Frontend Engineering'] },
      { title: 'Senior Frontend Developer', departmentId: deptMap['Frontend Engineering'] },
      { title: 'Frontend Software Engineer', departmentId: deptMap['Frontend Engineering'] },
      { title: 'Junior Frontend Developer', departmentId: deptMap['Frontend Engineering'] },
      { title: 'Principal Distributed Systems Architect', departmentId: deptMap['Backend & Core Systems'] },
      { title: 'Senior Backend Engineer (Go/Node)', departmentId: deptMap['Backend & Core Systems'] },
      { title: 'Backend Software Engineer', departmentId: deptMap['Backend & Core Systems'] },
      { title: 'Database Reliability Engineer', departmentId: deptMap['Backend & Core Systems'] },
      { title: 'Lead Mobile Architect', departmentId: deptMap['Mobile Engineering'] },
      { title: 'Senior Android/iOS Engineer', departmentId: deptMap['Mobile Engineering'] },
      { title: 'Lead DevOps & Site Reliability Engineer', departmentId: deptMap['Cloud Infrastructure & SRE'] },
      { title: 'Cloud Platform Engineer (AWS/K8s)', departmentId: deptMap['Cloud Infrastructure & SRE'] },
      { title: 'Lead SDET & Automation Architect', departmentId: deptMap['Quality Engineering & Automation'] },
      { title: 'Senior QA Automation Engineer', departmentId: deptMap['Quality Engineering & Automation'] },
      { title: 'Head of People & Culture', departmentId: deptMap['Human Resources & People Ops'] },
      { title: 'Senior HR Business Partner', departmentId: deptMap['Human Resources & People Ops'] },
      { title: 'People Operations Specialist', departmentId: deptMap['Human Resources & People Ops'] },
      { title: 'Head of Total Rewards & Payroll', departmentId: deptMap['Payroll & Total Rewards'] },
      { title: 'Senior Payroll Operations Analyst', departmentId: deptMap['Payroll & Total Rewards'] },
      { title: 'Statutory Compliance Specialist', departmentId: deptMap['Payroll & Total Rewards'] },
      { title: 'Lead Technical Talent Recruiter', departmentId: deptMap['Talent Acquisition'] },
      { title: 'Enterprise Account Executive', departmentId: deptMap['Enterprise Sales & Partnerships'] },
      { title: 'Corporate Legal Counsel & Compliance Lead', departmentId: deptMap['Finance, Legal & Governance'] },
    ];

    const insertedJobs = await db.insert(schema.jobPositions).values(jobPositionsData).returning();
    console.info(`✅ Seeded ${insertedJobs.length} job positions`);

    // 5. Seed Working Schedules (5 schedules + lines)
    const schedulesData = [
      { name: 'Standard General Shift (Mon-Fri 9-6)', weeklyHours: '40.00', isActive: true },
      { name: 'Early Morning Engineering Shift (Mon-Fri 7:30-4:30)', weeklyHours: '40.00', isActive: true },
      { name: 'US East Coast Overlap Shift (Mon-Fri 12:30-9:30)', weeklyHours: '40.00', isActive: true },
      { name: 'Flexible Core Hours Shift (Mon-Fri 10-6:30)', weeklyHours: '37.50', isActive: true },
      { name: 'Weekend 24/7 Support Shift (Fri-Sun 8-8)', weeklyHours: '36.00', isActive: true },
    ];

    const insertedSchedules = await db.insert(schema.workingSchedules).values(schedulesData).returning();
    const defaultScheduleId = insertedSchedules[0].id;

    const scheduleLinesData: Array<{
      scheduleId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
    }> = [];

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const day of weekdays) {
      scheduleLinesData.push({
        scheduleId: insertedSchedules[0].id,
        dayOfWeek: day,
        startTime: '09:00:00',
        endTime: '18:00:00',
        breakMinutes: 60,
      });
      scheduleLinesData.push({
        scheduleId: insertedSchedules[1].id,
        dayOfWeek: day,
        startTime: '07:30:00',
        endTime: '16:30:00',
        breakMinutes: 60,
      });
      scheduleLinesData.push({
        scheduleId: insertedSchedules[2].id,
        dayOfWeek: day,
        startTime: '12:30:00',
        endTime: '21:30:00',
        breakMinutes: 60,
      });
      scheduleLinesData.push({
        scheduleId: insertedSchedules[3].id,
        dayOfWeek: day,
        startTime: '10:00:00',
        endTime: '18:30:00',
        breakMinutes: 60,
      });
    }
    for (const day of ['Friday', 'Saturday', 'Sunday']) {
      scheduleLinesData.push({
        scheduleId: insertedSchedules[4].id,
        dayOfWeek: day,
        startTime: '08:00:00',
        endTime: '20:00:00',
        breakMinutes: 60,
      });
    }

    await db.insert(schema.workingScheduleLines).values(scheduleLinesData);
    console.info(`✅ Seeded ${insertedSchedules.length} working schedules with ${scheduleLinesData.length} lines`);

    // 6. Seed Salary Structures & Comprehensive Ordered Rules
    const structuresData = [
      {
        name: 'Standard Full-Time Tech Structure',
        code: 'STD_TECH_2026',
        description: 'Comprehensive tech engineering compensation package with statutory compliance',
        isActive: true,
      },
      {
        name: 'Corporate & Operations Compensation Structure',
        code: 'CORP_OPS_2026',
        description: 'Operations, HR, Finance and Corporate administration compensation package',
        isActive: true,
      },
      {
        name: 'Executive Leadership Rewards Structure',
        code: 'EXEC_LEAD_2026',
        description: 'Executive management and department head compensation structure',
        isActive: true,
      },
    ];

    const insertedStructures = await db.insert(schema.salaryStructures).values(structuresData).returning();
    const defaultStructureId = insertedStructures[0].id;

    const createStructureRules = (structureId: string) => [
      {
        structureId,
        code: 'BASIC',
        name: 'Basic Salary',
        category: 'basic',
        sequence: 10,
        computationMethod: 'percentage',
        percentage: '50.00',
        percentageOfCode: 'contractWage',
      },
      {
        structureId,
        code: 'HRA',
        name: 'House Rent Allowance (HRA)',
        category: 'allowance',
        sequence: 20,
        computationMethod: 'percentage',
        percentage: '50.00',
        percentageOfCode: 'BASIC',
      },
      {
        structureId,
        code: 'SPECIAL_ALLOWANCE',
        name: 'Special Allowance',
        category: 'allowance',
        sequence: 30,
        computationMethod: 'percentage',
        percentage: '30.00',
        percentageOfCode: 'BASIC',
      },
      {
        structureId,
        code: 'CONVEYANCE',
        name: 'Conveyance Allowance',
        category: 'allowance',
        sequence: 40,
        computationMethod: 'fixed',
        amount: '1600.00',
      },
      {
        structureId,
        code: 'MEDICAL',
        name: 'Medical Allowance',
        category: 'allowance',
        sequence: 50,
        computationMethod: 'fixed',
        amount: '1250.00',
      },
      {
        structureId,
        code: 'GROSS',
        name: 'Gross Earnings',
        category: 'gross',
        sequence: 100,
        computationMethod: 'formula',
        formula: 'BASIC + HRA + SPECIAL_ALLOWANCE + CONVEYANCE + MEDICAL',
      },
      {
        structureId,
        code: 'PF_EMP',
        name: 'Provident Fund (Employee PF)',
        category: 'deduction',
        sequence: 110,
        computationMethod: 'percentage',
        percentage: '12.00',
        percentageOfCode: 'BASIC',
      },
      {
        structureId,
        code: 'PROF_TAX',
        name: 'Professional Tax (PT)',
        category: 'deduction',
        sequence: 120,
        computationMethod: 'fixed',
        amount: '200.00',
      },
      {
        structureId,
        code: 'TDS',
        name: 'Income Tax (TDS)',
        category: 'deduction',
        sequence: 130,
        computationMethod: 'fixed',
        amount: '2500.00',
      },
      {
        structureId,
        code: 'TOTAL_DEDUCTIONS',
        name: 'Total Deductions',
        category: 'deduction',
        sequence: 190,
        computationMethod: 'formula',
        formula: 'PF_EMP + PROF_TAX + TDS',
      },
      {
        structureId,
        code: 'NET',
        name: 'Net Payable Salary',
        category: 'net',
        sequence: 200,
        computationMethod: 'formula',
        formula: 'GROSS - TOTAL_DEDUCTIONS',
      },
    ];

    const allRulesData = insertedStructures.flatMap((s) => createStructureRules(s.id));
    await db.insert(schema.salaryRules).values(allRulesData);
    console.info(`✅ Seeded ${insertedStructures.length} salary structures with ${allRulesData.length} salary rules`);

    // 7. Generate 125 Plausible Users and Employees (Forming a coherent org hierarchy)
    type Candidate = {
      firstName: string;
      lastName: string;
      email: string;
      role: 'Admin' | 'HR Manager' | 'HR Payroll Manager' | 'HR Payroll User' | 'Employee';
      gender: 'Male' | 'Female';
      deptIndex: number;
      jobIndex: number;
      wage: number;
      location: string;
      joiningDate: string;
      isManager: boolean;
    };

    const candidates: Candidate[] = [
      // Key Demonstration Users
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@peoplepay.com',
        role: 'Admin',
        gender: 'Male',
        deptIndex: 0,
        jobIndex: 0,
        wage: 250000,
        location: 'Mumbai Corporate HQ',
        joiningDate: '2023-01-01',
        isManager: true,
      },
      {
        firstName: 'Nisha',
        lastName: 'Rao',
        email: 'nisha@company.com',
        role: 'HR Payroll Manager',
        gender: 'Female',
        deptIndex: 8,
        jobIndex: 24,
        wage: 185000,
        location: 'Bengaluru Tech Hub',
        joiningDate: '2023-03-01',
        isManager: true,
      },
      {
        firstName: 'Maya',
        lastName: 'Shah',
        email: 'maya@company.com',
        role: 'HR Manager',
        gender: 'Female',
        deptIndex: 7,
        jobIndex: 21,
        wage: 155000,
        location: 'Bengaluru Tech Hub',
        joiningDate: '2023-04-15',
        isManager: true,
      },
      {
        firstName: 'Aarav',
        lastName: 'Mehta',
        email: 'aarav@company.com',
        role: 'HR Payroll User',
        gender: 'Male',
        deptIndex: 8,
        jobIndex: 25,
        wage: 110000,
        location: 'Bengaluru Tech Hub',
        joiningDate: '2023-06-01',
        isManager: true,
      },
      {
        firstName: 'Rohan',
        lastName: 'Patel',
        email: 'rohan@company.com',
        role: 'Employee',
        gender: 'Male',
        deptIndex: 3,
        jobIndex: 12,
        wage: 95000,
        location: 'Bengaluru Tech Hub',
        joiningDate: '2024-01-10',
        isManager: false,
      },
    ];

    // Generate 120 more realistic candidates (Total = 125)
    let mIdx = 0;
    let fIdx = 0;
    let lIdx = 0;
    const usedEmails = new Set<string>(candidates.map((c) => c.email));

    while (candidates.length < 125) {
      const isFemale = candidates.length % 2 === 0;
      const firstName = isFemale
        ? FIRST_NAMES_FEMALE[fIdx++ % FIRST_NAMES_FEMALE.length]
        : FIRST_NAMES_MALE[mIdx++ % FIRST_NAMES_MALE.length];
      const lastName = LAST_NAMES[lIdx++ % LAST_NAMES.length];

      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
      if (usedEmails.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${candidates.length}@company.com`;
      }
      usedEmails.add(email);

      // Distribute across departments & jobs realistically
      const deptIndex = (candidates.length % (insertedDepts.length - 1)) + 1; // 1..11
      const jobIndex = (candidates.length % (insertedJobs.length - 4)) + 4; // Skip CEO/CTO

      // Plausible wage based on experience level
      let wage = 55000;
      if (candidates.length < 15) wage = 175000; // Leadership / Directors
      else if (candidates.length < 35) wage = 135000; // Managers / Leads
      else if (candidates.length < 75) wage = 95000; // Senior Engineers
      else if (candidates.length < 110) wage = 72000; // Mid-level
      else wage = 48000; // Junior / Associates

      const location = LOCATIONS[candidates.length % LOCATIONS.length];

      // Realistic joining dates spread between 2022 and early 2026
      const year = 2022 + (candidates.length % 4);
      const month = String((candidates.length % 12) + 1).padStart(2, '0');
      const day = String(((candidates.length * 3) % 27) + 1).padStart(2, '0');
      const joiningDate = `${year}-${month}-${day}`;

      let role: Candidate['role'] = 'Employee';
      if (candidates.length === 6) role = 'HR Manager';
      if (candidates.length === 7) role = 'HR Payroll User';

      candidates.push({
        firstName,
        lastName,
        email,
        role,
        gender: isFemale ? 'Female' : 'Male',
        deptIndex,
        jobIndex,
        wage,
        location,
        joiningDate,
        isManager: candidates.length < 25,
      });
    }

    // Insert Users
    const usersToInsert = candidates.map((c) => ({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      passwordHash: c.role === 'Admin' ? adminPasswordHash : staffPasswordHash,
      role: c.role,
      isActive: true,
      isEmailVerified: true,
    }));

    const insertedUsers = await db.insert(schema.users).values(usersToInsert).returning();
    console.info(`✅ Seeded ${insertedUsers.length} users`);

    // Insert Employees linked to Users
    const employeesToInsert = insertedUsers.map((u, i) => {
      const c = candidates[i];
      const bank = BANKS[i % BANKS.length];
      const panPrefix = 'ABCDE';
      const panNum = String(1000 + (i % 8999));
      const panSuffix = String.fromCharCode(65 + (i % 26));

      // Birth year between 1980 and 2000
      const birthYear = 1980 + (i % 20);
      const birthMonth = String((i % 12) + 1).padStart(2, '0');
      const birthDay = String(((i * 5) % 27) + 1).padStart(2, '0');

      return {
        userId: u.id,
        departmentId: insertedDepts[c.deptIndex].id,
        jobPositionId: insertedJobs[c.jobIndex].id,
        workingScheduleId: insertedSchedules[i % insertedSchedules.length].id,
        location: c.location,
        employmentStatus: 'active',
        dateOfJoining: c.joiningDate,
        dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
        gender: c.gender,
        identificationNumber: `${panPrefix}${panNum}${panSuffix}`,
        bankName: bank.name,
        bankAccountNumber: `50100${String(i).padStart(4, '0')}${String(1000 + i * 7)}`,
        bankRoutingCode: bank.ifsc,
        phone: `+91 ${9800000000 + (i * 12345) % 99999999}`,
      };
    });

    const insertedEmployees = await db.insert(schema.employees).values(employeesToInsert).returning();
    console.info(`✅ Seeded ${insertedEmployees.length} employees`);

    // Link real manager hierarchy (CEO Nisha -> Dept Leads -> ICs)
    const topManager = insertedEmployees[1]; // Nisha Rao
    const managers = insertedEmployees.slice(1, 15); // First 15 are manager tier

    for (let i = 0; i < insertedEmployees.length; i++) {
      const emp = insertedEmployees[i];
      if (i === 1) continue; // CEO has no manager

      let managerId: string;
      if (i < 15) {
        managerId = topManager.id; // Dept heads report to Nisha
      } else {
        const assignedManager = managers[i % managers.length];
        managerId = assignedManager.id;
      }

      await db
        .update(schema.employees)
        .set({ managerId })
        .where(eq(schema.employees.id, emp.id));
    }
    console.info('✅ Employee manager hierarchy established');

    // 8. Seed Contracts (125 active contracts, 1 per employee)
    const contractsData = insertedEmployees.map((emp, i) => {
      const c = candidates[i];
      return {
        employeeId: emp.id,
        name: `${c.firstName} ${c.lastName} - FY26 Employment Agreement`,
        wage: String(c.wage.toFixed(2)),
        wageType: 'monthly',
        salaryStructureId: defaultStructureId,
        workingScheduleId: emp.workingScheduleId,
        departmentId: emp.departmentId,
        jobPositionId: emp.jobPositionId,
        startDate: c.joiningDate < '2026-04-01' ? '2026-04-01' : c.joiningDate,
        status: 'active',
        notes: 'Standard permanent corporate employment contract with FY26 compensation schedule',
      };
    });

    const insertedContracts = await db.insert(schema.contracts).values(contractsData).returning();
    console.info(`✅ Seeded ${insertedContracts.length} employment contracts`);

    // 9. Seed Time Off Types (6 comprehensive types)
    const timeOffTypesData = [
      {
        name: 'Paid Annual Vacation',
        code: 'ANNUAL',
        unit: 'days',
        requiresAllocation: true,
        approvalType: 'manager_and_hr',
        isPaid: true,
        isActive: true,
      },
      {
        name: 'Sick & Medical Leave',
        code: 'SICK',
        unit: 'days',
        requiresAllocation: true,
        approvalType: 'hr_only',
        isPaid: true,
        isActive: true,
      },
      {
        name: 'Casual / Personal Leave',
        code: 'CASUAL',
        unit: 'days',
        requiresAllocation: true,
        approvalType: 'manager_and_hr',
        isPaid: true,
        isActive: true,
      },
      {
        name: 'Parental Leave',
        code: 'PARENTAL',
        unit: 'days',
        requiresAllocation: true,
        approvalType: 'hr_only',
        isPaid: true,
        isActive: true,
      },
      {
        name: 'Compensatory Off',
        code: 'COMP_OFF',
        unit: 'days',
        requiresAllocation: true,
        approvalType: 'manager_and_hr',
        isPaid: true,
        isActive: true,
      },
      {
        name: 'Unpaid Leave (LWP)',
        code: 'UNPAID',
        unit: 'days',
        requiresAllocation: false,
        approvalType: 'manager_and_hr',
        isPaid: false,
        isActive: true,
      },
    ];

    const insertedTypes = await db.insert(schema.timeOffTypes).values(timeOffTypesData).returning();
    const typeMap: Record<string, string> = {};
    for (const t of insertedTypes) {
      typeMap[t.code] = t.id;
    }
    console.info(`✅ Seeded ${insertedTypes.length} time off types`);

    // 10. Seed Time Off Allocations (180 allocations across 60 employees)
    const allocationsData: Array<{
      employeeId: string;
      timeOffTypeId: string;
      allocatedAmount: string;
      takenAmount: string;
      remainingAmount: string;
      validFrom: string;
      validTo: string;
      status: string;
      approvedBy?: string;
    }> = [];

    // For first 60 employees, allocate Annual (20), Sick (10), Casual (5) = 180 allocations
    for (let i = 0; i < 60; i++) {
      const emp = insertedEmployees[i];
      const annualTaken = (i % 5);
      const sickTaken = (i % 3);
      const casualTaken = (i % 2);

      allocationsData.push({
        employeeId: emp.id,
        timeOffTypeId: typeMap['ANNUAL'],
        allocatedAmount: '20.00',
        takenAmount: String(annualTaken.toFixed(2)),
        remainingAmount: String((20 - annualTaken).toFixed(2)),
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'approved',
        approvedBy: insertedUsers[0].id,
      });

      allocationsData.push({
        employeeId: emp.id,
        timeOffTypeId: typeMap['SICK'],
        allocatedAmount: '10.00',
        takenAmount: String(sickTaken.toFixed(2)),
        remainingAmount: String((10 - sickTaken).toFixed(2)),
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'approved',
        approvedBy: insertedUsers[0].id,
      });

      allocationsData.push({
        employeeId: emp.id,
        timeOffTypeId: typeMap['CASUAL'],
        allocatedAmount: '5.00',
        takenAmount: String(casualTaken.toFixed(2)),
        remainingAmount: String((5 - casualTaken).toFixed(2)),
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        status: 'approved',
        approvedBy: insertedUsers[0].id,
      });
    }

    const insertedAllocations = await db.insert(schema.timeOffAllocations).values(allocationsData).returning();
    console.info(`✅ Seeded ${insertedAllocations.length} time off allocations`);

    // 11. Seed Time Off Requests (130 plausible requests)
    const requestsData: Array<{
      employeeId: string;
      timeOffTypeId: string;
      startDate: string;
      endDate: string;
      duration: string;
      reason: string;
      status: string;
      approvedBy?: string;
      approvedAt?: Date;
      refusedReason?: string;
    }> = [];

    const requestMonths = ['05', '06', '07', '08', '09'];
    for (let i = 0; i < 130; i++) {
      const emp = insertedEmployees[i % 60];
      const month = requestMonths[i % requestMonths.length];
      const startDayNum = ((i * 3) % 24) + 1;
      const duration = (i % 4) + 1; // 1 to 4 days
      const endDayNum = startDayNum + duration - 1;

      const startDate = `2026-${month}-${String(startDayNum).padStart(2, '0')}`;
      const endDate = `2026-${month}-${String(endDayNum).padStart(2, '0')}`;

      const typeKeys = ['ANNUAL', 'SICK', 'CASUAL', 'COMP_OFF'];
      const chosenType = typeKeys[i % typeKeys.length];
      const reason = LEAVE_REASONS[i % LEAVE_REASONS.length];

      let status = 'approved';
      let approvedBy: string | undefined = topManager.userId;
      let approvedAt: Date | undefined = new Date('2026-06-01T10:00:00Z');
      let refusedReason: string | undefined = undefined;

      if (i % 7 === 0) {
        status = 'pending';
        approvedBy = undefined;
        approvedAt = undefined;
      } else if (i % 11 === 0) {
        status = 'refused';
        approvedBy = topManager.userId;
        approvedAt = new Date('2026-07-02T11:30:00Z');
        refusedReason = 'Key product release milestone scheduled during these dates. Kindly reschedule.';
      }

      requestsData.push({
        employeeId: emp.id,
        timeOffTypeId: typeMap[chosenType],
        startDate,
        endDate,
        duration: String(duration.toFixed(2)),
        reason,
        status,
        approvedBy,
        approvedAt,
        refusedReason,
      });
    }

    const insertedRequests = await db.insert(schema.timeOffRequests).values(requestsData).returning();
    console.info(`✅ Seeded ${insertedRequests.length} time off requests`);

    // 12. Seed Attendance Records (250 entries across business days in August & September)
    const attendanceData: Array<{
      employeeId: string;
      date: string;
      checkIn: Date;
      checkOut: Date;
      workedHours: string;
      status: string;
      exceptionNote?: string;
    }> = [];

    // Distinct 15 business dates in August and September 2026
    const sampleDates = [
      '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
      '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    ];

    // For 20 selected employees across 13 dates = 260 unique (employeeId, date) entries
    const attendanceEmployees = insertedEmployees.slice(0, 20);
    for (const emp of attendanceEmployees) {
      for (let d = 0; d < 13; d++) {
        const curDate = sampleDates[d];
        const isLate = (d + attendanceData.length) % 8 === 0;
        const isEarlyDepart = (d + attendanceData.length) % 15 === 0;

        const checkInHour = isLate ? 10 : 9;
        const checkInMin = isLate ? 15 : ((d * 7) % 25);
        const checkOutHour = isEarlyDepart ? 15 : 18;
        const checkOutMin = isEarlyDepart ? 0 : ((d * 11) % 30);

        const checkIn = new Date(`${curDate}T${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00Z`);
        const checkOut = new Date(`${curDate}T${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00Z`);

        const diffHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) - 1.0; // minus 1 hr lunch
        const workedHours = Math.max(diffHours, 4.0).toFixed(2);

        let status = 'Present';
        let exceptionNote: string | undefined = undefined;

        if (isLate) {
          status = 'Late';
          exceptionNote = 'Late arrival recorded due to heavy metro corridor congestion.';
        } else if (isEarlyDepart) {
          status = 'Half Day';
          exceptionNote = 'Approved half-day departure for medical appointment.';
        }

        attendanceData.push({
          employeeId: emp.id,
          date: curDate,
          checkIn,
          checkOut,
          workedHours,
          status,
          exceptionNote,
        });
      }
    }

    const insertedAttendance = await db.insert(schema.attendance).values(attendanceData).returning();
    console.info(`✅ Seeded ${insertedAttendance.length} daily attendance records`);

    // 13. Seed Payruns, Payslips (220 payslips) & Payslip Lines (2,420 lines)
    const payrunsMeta = [
      {
        name: 'June 2026 Regular Corporate Payrun',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
        status: 'paid',
        empCount: 65,
      },
      {
        name: 'July 2026 Regular Corporate Payrun',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        status: 'paid',
        empCount: 75,
      },
      {
        name: 'August 2026 Regular Corporate Payrun',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        status: 'validated',
        empCount: 80,
      },
    ];

    let totalPayslipsCount = 0;
    let totalLinesCount = 0;

    for (const pm of payrunsMeta) {
      // 1. Create Payrun
      const [payrun] = await db
        .insert(schema.payruns)
        .values({
          name: pm.name,
          salaryStructureId: defaultStructureId,
          periodStart: pm.periodStart,
          periodEnd: pm.periodEnd,
          status: pm.status,
          notes: `Monthly payroll processing for ${pm.name}`,
        })
        .returning();

      // 2. Prepare Payslips for subset of employees
      const empsForRun = insertedEmployees.slice(0, pm.empCount);
      let runBasic = 0;
      let runGross = 0;
      let runDeductions = 0;
      let runNet = 0;

      const payslipsToInsert = empsForRun.map((emp, i) => {
        const contract = insertedContracts[i];
        const wage = parseFloat(contract.wage);

        // Standard Indian Tech Salary breakdown
        const basic = wage * 0.5;
        const hra = basic * 0.5;
        const special = basic * 0.3;
        const conveyance = 1600;
        const medical = 1250;
        const gross = basic + hra + special + conveyance + medical;

        const pf = basic * 0.12;
        const pt = 200;
        const tds = wage > 100000 ? 5000 : 2500;
        const deductions = pf + pt + tds;
        const net = gross - deductions;

        runBasic += basic;
        runGross += gross;
        runDeductions += deductions;
        runNet += net;

        return {
          payrunId: payrun.id,
          employeeId: emp.id,
          contractId: contract.id,
          structureId: defaultStructureId,
          periodStart: pm.periodStart,
          periodEnd: pm.periodEnd,
          workedDays: '22.00',
          basicSalary: basic.toFixed(2),
          grossSalary: gross.toFixed(2),
          totalDeductions: deductions.toFixed(2),
          netSalary: net.toFixed(2),
          status: pm.status === 'paid' ? 'paid' : 'validated',
        };
      });

      const insertedPayslips = await db.insert(schema.payslips).values(payslipsToInsert).returning();
      totalPayslipsCount += insertedPayslips.length;

      // 3. Update Payrun Totals
      await db
        .update(schema.payruns)
        .set({
          totalBasic: runBasic.toFixed(2),
          totalGross: runGross.toFixed(2),
          totalDeductions: runDeductions.toFixed(2),
          totalNet: runNet.toFixed(2),
          payslipCount: insertedPayslips.length,
        })
        .where(eq(schema.payruns.id, payrun.id));

      // 4. Batch Insert Payslip Lines
      const linesToInsert = insertedPayslips.flatMap((ps, i) => {
        const contract = insertedContracts[i];
        const wage = parseFloat(contract.wage);
        const basic = wage * 0.5;
        const hra = basic * 0.5;
        const special = basic * 0.3;
        const conveyance = 1600;
        const medical = 1250;
        const gross = basic + hra + special + conveyance + medical;
        const pf = basic * 0.12;
        const pt = 200;
        const tds = wage > 100000 ? 5000 : 2500;
        const deductions = pf + pt + tds;
        const net = gross - deductions;

        return [
          { payslipId: ps.id, code: 'BASIC', name: 'Basic Salary', category: 'basic', sequence: 10, amount: basic.toFixed(2) },
          { payslipId: ps.id, code: 'HRA', name: 'House Rent Allowance (HRA)', category: 'allowance', sequence: 20, amount: hra.toFixed(2) },
          { payslipId: ps.id, code: 'SPECIAL_ALLOWANCE', name: 'Special Allowance', category: 'allowance', sequence: 30, amount: special.toFixed(2) },
          { payslipId: ps.id, code: 'CONVEYANCE', name: 'Conveyance Allowance', category: 'allowance', sequence: 40, amount: conveyance.toFixed(2) },
          { payslipId: ps.id, code: 'MEDICAL', name: 'Medical Allowance', category: 'allowance', sequence: 50, amount: medical.toFixed(2) },
          { payslipId: ps.id, code: 'GROSS', name: 'Gross Earnings', category: 'gross', sequence: 100, amount: gross.toFixed(2) },
          { payslipId: ps.id, code: 'PF_EMP', name: 'Provident Fund (Employee PF)', category: 'deduction', sequence: 110, amount: pf.toFixed(2) },
          { payslipId: ps.id, code: 'PROF_TAX', name: 'Professional Tax (PT)', category: 'deduction', sequence: 120, amount: pt.toFixed(2) },
          { payslipId: ps.id, code: 'TDS', name: 'Income Tax (TDS)', category: 'deduction', sequence: 130, amount: tds.toFixed(2) },
          { payslipId: ps.id, code: 'TOTAL_DEDUCTIONS', name: 'Total Deductions', category: 'deduction', sequence: 190, amount: deductions.toFixed(2) },
          { payslipId: ps.id, code: 'NET', name: 'Net Payable Salary', category: 'net', sequence: 200, amount: net.toFixed(2) },
        ];
      });

      await db.insert(schema.payslipLines).values(linesToInsert);
      totalLinesCount += linesToInsert.length;
    }

    console.info(`✅ Seeded ${payrunsMeta.length} payruns with ${totalPayslipsCount} payslips and ${totalLinesCount} detailed payslip lines`);

    // 14. Seed Company Policies (6 comprehensive policies)
    const initialPolicies = [
      {
        code: 'CODE_OF_CONDUCT',
        title: 'Code of Business Conduct & Ethics',
        category: 'compliance',
        version: '1.0',
        summary: 'Sets mandatory standards for integrity, workplace respect, anti-bribery, and ethical decision-making.',
        content: 'Anchorage Technologies Pvt. Ltd. is dedicated to conducting business with absolute honesty, transparency, and integrity.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'INFO_SECURITY',
        title: 'Information Security & Data Privacy Policy',
        category: 'security',
        version: '1.2',
        summary: 'Governs data protection protocols, confidential system access, multi-factor authentication, and device encryption.',
        content: 'All corporate assets, customer personal data, and source code repositories are designated Confidential.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'POSH_POLICY',
        title: 'Prevention of Sexual Harassment (POSH) & Anti-Discrimination',
        category: 'compliance',
        version: '2.0',
        summary: 'Comprehensive policy providing a safe, respectful environment free from sexual harassment.',
        content: 'Strict zero-tolerance policy against any form of sexual harassment or discrimination in the workplace.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'REMOTE_WORK',
        title: 'Remote & Hybrid Workplace Guidelines',
        category: 'workplace',
        version: '1.1',
        summary: 'Operational expectations, core working hours, virtual meeting etiquette, and ergonomics for hybrid teams.',
        content: 'Full-time employees operate on a flexible hybrid model comprising structured in-office days and remote allowances.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'IP_CONFIDENTIALITY',
        title: 'Intellectual Property & Inventions Confidentiality Agreement',
        category: 'compliance',
        version: '1.0',
        summary: 'Protects proprietary software, customer datasets, and confirms invention assignments.',
        content: 'All software, algorithms, designs, and patents created during employment are exclusive property of the company.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'LEAVE_ATTENDANCE',
        title: 'Leave, Working Hours & Regularization Policy',
        category: 'hr',
        version: '1.0',
        summary: 'Defines daily check-in protocols, shift schedules, paid time off accruals, and regularization procedures.',
        content: 'Standard working hours consist of 40 hours per week Monday to Friday with mandatory 1-hour lunch break.',
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
    ];

    const insertedPolicies = await db.insert(schema.companyPolicies).values(initialPolicies).returning();
    console.info(`✅ Seeded ${insertedPolicies.length} company policies`);

    // 15. Seed Policy Acceptances (140 employee acceptances)
    const acceptancesData: Array<{
      policyId: string;
      userId: string;
      employeeId: string;
      policyVersion: string;
      acceptedAt: Date;
      ipAddress: string;
      userAgent: string;
    }> = [];

    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0',
    ];

    // First 70 employees accept policy 0 and policy 1 = 140 acceptances
    for (let i = 0; i < 70; i++) {
      const emp = insertedEmployees[i];
      const user = insertedUsers[i];
      const ip = `10.0.${Math.floor(i / 30) + 1}.${(i % 250) + 10}`;

      acceptancesData.push({
        policyId: insertedPolicies[0].id,
        userId: user.id,
        employeeId: emp.id,
        policyVersion: insertedPolicies[0].version,
        acceptedAt: new Date('2026-04-05T09:30:00Z'),
        ipAddress: ip,
        userAgent: userAgents[i % userAgents.length],
      });

      acceptancesData.push({
        policyId: insertedPolicies[1].id,
        userId: user.id,
        employeeId: emp.id,
        policyVersion: insertedPolicies[1].version,
        acceptedAt: new Date('2026-04-06T14:15:00Z'),
        ipAddress: ip,
        userAgent: userAgents[i % userAgents.length],
      });
    }

    const insertedAcceptances = await db.insert(schema.policyAcceptances).values(acceptancesData).returning();
    console.info(`✅ Seeded ${insertedAcceptances.length} policy compliance acceptances`);

    // 16. Seed System Audit Logs (140 realistic logs)
    const auditActions = [
      { action: 'USER_LOGIN', entityType: 'user', desc: 'User authenticated successfully via credentials' },
      { action: 'CONTRACT_CREATED', entityType: 'contract', desc: 'Permanent employment contract generated and activated' },
      { action: 'PAYRUN_COMPUTED', entityType: 'payrun', desc: 'Monthly regular payroll computation executed' },
      { action: 'PAYRUN_VALIDATED', entityType: 'payrun', desc: 'Payroll administrator validated compensation ledger' },
      { action: 'PAYRUN_PAID', entityType: 'payrun', desc: 'Net salary disbursemens marked as paid and sent to bank' },
      { action: 'TIMEOFF_APPROVED', entityType: 'time_off_request', desc: 'Manager approved employee leave request' },
      { action: 'POLICY_ACCEPTED', entityType: 'policy', desc: 'Employee acknowledged mandatory compliance policy' },
      { action: 'SCHEDULE_ASSIGNED', entityType: 'working_schedule', desc: 'Assigned employee to weekly working schedule' },
      { action: 'PASSWORD_RESET', entityType: 'user', desc: 'Account password changed via secure authentication flow' },
    ];

    const auditLogsData: Array<{
      actorId: string;
      actorName: string;
      action: string;
      entityType: string;
      entityId: string;
      description: string;
      metadata: Record<string, unknown>;
      createdAt: Date;
    }> = [];

    for (let i = 0; i < 140; i++) {
      const template = auditActions[i % auditActions.length];
      const actor = insertedUsers[i % 15]; // Admin or managers perform actions
      const targetEmp = insertedEmployees[i % insertedEmployees.length];

      auditLogsData.push({
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`,
        action: template.action,
        entityType: template.entityType,
        entityId: targetEmp.id,
        description: `${template.desc} for ${candidates[i % candidates.length].firstName} ${candidates[i % candidates.length].lastName}`,
        metadata: {
          ip: `10.0.1.${(i % 240) + 10}`,
          platform: 'PeoplePay360 Enterprise Portal',
          status: 'SUCCESS',
        },
        createdAt: new Date(Date.now() - (140 - i) * 3600000 * 6), // Staggered over recent weeks
      });
    }

    const insertedLogs = await db.insert(schema.auditLogs).values(auditLogsData).returning();
    console.info(`✅ Seeded ${insertedLogs.length} audit logs`);

    console.info('===============================================================');
    console.info('🎉 PEOPLEPAY360 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.info(`   Users:                 ${insertedUsers.length}`);
    console.info(`   Employees:             ${insertedEmployees.length}`);
    console.info(`   Departments:           ${insertedDepts.length}`);
    console.info(`   Job Positions:         ${insertedJobs.length}`);
    console.info(`   Working Schedules:     ${insertedSchedules.length} (${scheduleLinesData.length} lines)`);
    console.info(`   Salary Structures:     ${insertedStructures.length} (${allRulesData.length} rules)`);
    console.info(`   Contracts:             ${insertedContracts.length}`);
    console.info(`   Attendance Records:    ${insertedAttendance.length}`);
    console.info(`   Time Off Types:        ${insertedTypes.length}`);
    console.info(`   Time Off Allocations:  ${insertedAllocations.length}`);
    console.info(`   Time Off Requests:     ${insertedRequests.length}`);
    console.info(`   Payruns:               ${payrunsMeta.length}`);
    console.info(`   Payslips:              ${totalPayslipsCount}`);
    console.info(`   Payslip Breakdown:     ${totalLinesCount} lines`);
    console.info(`   Company Policies:      ${insertedPolicies.length}`);
    console.info(`   Policy Acceptances:    ${insertedAcceptances.length}`);
    console.info(`   System Audit Logs:     ${insertedLogs.length}`);
    console.info('===============================================================');
    console.info('🔑 Key Login Credentials:');
    console.info('   Admin:      admin@peoplepay.com / Admin@123');
    console.info('   HR Payroll: nisha@company.com   / Staff@123');
    console.info('   HR Manager: maya@company.com    / Staff@123');
    console.info('   Payroll:    aarav@company.com   / Staff@123');
    console.info('   Employee:   rohan@company.com   / Staff@123');
    console.info('   All staff:  (email in list)     / Staff@123');
    console.info('===============================================================');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await closeDb();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}
