import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { pool, db, closeDb } from './db';
import * as schema from '../db/schema';
import { passwordSchema } from '../modules/auth/auth.validators';

export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.info('🌱 Starting PeoplePay360 database seed...');

    // 1. Ensure schema tables exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT 'Main Headquarters';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20);

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

    // 2. Validate admin password criteria
    const adminEmail = 'admin@peoplepay.com';
    const adminRawPassword = 'Admin@123';

    const validationResult = passwordSchema.safeParse(adminRawPassword);
    if (!validationResult.success) {
      throw new Error(`Seed password failed validation: ${validationResult.error.message}`);
    }

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(adminRawPassword, salt);

    // 3. Upsert Admin user
    const existingAdmin = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      const [adminUser] = await db
        .insert(schema.users)
        .values({
          firstName: 'System',
          lastName: 'Admin',
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: 'Admin',
          isActive: true,
          isEmailVerified: true,
        })
        .returning();

      await db.insert(schema.employees).values({
        userId: adminUser.id,
        employmentStatus: 'active',
      });
      console.info(`✅ Admin user created: ${adminEmail} (password: ${adminRawPassword})`);
    } else {
      await db
        .update(schema.users)
        .set({
          firstName: 'System',
          lastName: 'Admin',
          passwordHash: adminPasswordHash,
          role: 'Admin',
          isActive: true,
          isEmailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingAdmin[0].id));

      const existingEmp = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.userId, existingAdmin[0].id))
        .limit(1);

      if (existingEmp.length === 0) {
        await db.insert(schema.employees).values({
          userId: existingAdmin[0].id,
          employmentStatus: 'active',
        });
      }
      console.info(`✅ Admin user updated: ${adminEmail} (password: ${adminRawPassword})`);
    }

    // 4. Seed Departments
    const deptNames = ['Management', 'Technology', 'HR & Operations'];
    const deptMap: Record<string, string> = {};

    for (const name of deptNames) {
      const existingDept = await db
        .select()
        .from(schema.departments)
        .where(eq(schema.departments.name, name))
        .limit(1);

      if (existingDept.length > 0) {
        deptMap[name] = existingDept[0].id;
      } else {
        const [inserted] = await db.insert(schema.departments).values({ name }).returning();
        deptMap[name] = inserted.id;
      }
    }
    console.info('✅ Departments verified:', Object.keys(deptMap).join(', '));

    // 5. Seed Default Working Schedule
    const defaultScheduleName = 'Standard 40h/week (Mon-Fri 9-5)';
    let scheduleId: string;
    const existingSchedule = await db
      .select()
      .from(schema.workingSchedules)
      .where(eq(schema.workingSchedules.name, defaultScheduleName))
      .limit(1);

    if (existingSchedule.length > 0) {
      scheduleId = existingSchedule[0].id;
    } else {
      const [insertedSchedule] = await db
        .insert(schema.workingSchedules)
        .values({
          name: defaultScheduleName,
          weeklyHours: '40.00',
          isActive: true,
        })
        .returning();
      scheduleId = insertedSchedule.id;

      // Seed schedule lines for Mon-Fri
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        await db.insert(schema.workingScheduleLines).values({
          scheduleId,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '17:00:00',
          breakMinutes: 60,
        });
      }
    }

    // 6. Seed Sample Employees with real Locations and Manager hierarchy
    // Nisha Rao is Executive/Head; Maya Shah is HR Head; Aarav & Rohan report to Maya/Nisha
    const sampleEmployees = [
      {
        firstName: 'Nisha',
        lastName: 'Rao',
        email: 'nisha@company.com',
        departmentId: deptMap['Management'],
        location: 'Main Headquarters',
        role: 'HR Payroll Manager' as const,
        managerEmail: null,
      },
      {
        firstName: 'Maya',
        lastName: 'Shah',
        email: 'maya@company.com',
        departmentId: deptMap['HR & Operations'],
        location: 'Main Headquarters',
        role: 'HR Manager' as const,
        managerEmail: 'nisha@company.com',
      },
      {
        firstName: 'Aarav',
        lastName: 'Mehta',
        email: 'aarav@company.com',
        departmentId: deptMap['Technology'],
        location: 'Bengaluru Tech Hub',
        role: 'HR Payroll User' as const,
        managerEmail: 'nisha@company.com',
      },
      {
        firstName: 'Rohan',
        lastName: 'Patel',
        email: 'rohan@company.com',
        departmentId: deptMap['Technology'],
        location: 'Bengaluru Tech Hub',
        role: 'Employee' as const,
        managerEmail: 'aarav@company.com',
      },
    ];

    const staffPassword = 'Staff@123';
    const staffPasswordHash = await bcrypt.hash(staffPassword, salt);

    const emailToIdMap: Record<string, string> = {};

    for (const emp of sampleEmployees) {
      // 1. Find or create user
      let userId: string;
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, emp.email))
        .limit(1);

      if (existingUser.length === 0) {
        const [newUser] = await db
          .insert(schema.users)
          .values({
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            passwordHash: staffPasswordHash,
            role: emp.role,
            isActive: true,
            isEmailVerified: true,
          })
          .returning();
        userId = newUser.id;
      } else {
        userId = existingUser[0].id;
        await db
          .update(schema.users)
          .set({
            firstName: emp.firstName,
            lastName: emp.lastName,
            role: emp.role,
            isActive: true,
            isEmailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
      }

      // 2. Find or create employee linked to user
      let employeeId: string;
      const existingEmp = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.userId, userId))
        .limit(1);

      if (existingEmp.length === 0) {
        const [newEmp] = await db
          .insert(schema.employees)
          .values({
            userId,
            departmentId: emp.departmentId,
            workingScheduleId: scheduleId,
            location: emp.location,
            employmentStatus: 'active',
            bankName: 'HDFC Bank',
            bankAccountNumber: '50100492819283',
            bankRoutingCode: 'HDFC0001234',
            identificationNumber: 'ABCDE1234F',
          })
          .returning();
        employeeId = newEmp.id;
      } else {
        employeeId = existingEmp[0].id;
        await db
          .update(schema.employees)
          .set({
            departmentId: emp.departmentId,
            workingScheduleId: scheduleId,
            location: emp.location,
            employmentStatus: 'active',
            bankName: 'HDFC Bank',
            bankAccountNumber: '50100492819283',
            bankRoutingCode: 'HDFC0001234',
            identificationNumber: 'ABCDE1234F',
            updatedAt: new Date(),
          })
          .where(eq(schema.employees.id, employeeId));
      }

      emailToIdMap[emp.email] = employeeId;
    }

    // Link manager hierarchy
    for (const emp of sampleEmployees) {
      if (emp.managerEmail && emailToIdMap[emp.managerEmail]) {
        await db
          .update(schema.employees)
          .set({ managerId: emailToIdMap[emp.managerEmail] })
          .where(eq(schema.employees.id, emailToIdMap[emp.email]));
      }
    }

    // 7. Seed Salary Structure & Rules
    let salaryStructureId: string;
    const existingStructure = await db
      .select()
      .from(schema.salaryStructures)
      .where(eq(schema.salaryStructures.code, 'STD_TECH_2026'))
      .limit(1);

    if (existingStructure.length > 0) {
      salaryStructureId = existingStructure[0].id;
    } else {
      const [newStructure] = await db
        .insert(schema.salaryStructures)
        .values({
          name: 'Standard Full-Time Compensation Structure',
          code: 'STD_TECH_2026',
          description: 'Standard tech and corporate compensation package for FY 2026-27',
          isActive: true,
        })
        .returning();
      salaryStructureId = newStructure.id;

      const rulesToSeed = [
        {
          structureId: salaryStructureId,
          code: 'BASIC',
          name: 'Basic Salary',
          category: 'basic',
          sequence: 10,
          computationMethod: 'percentage',
          percentage: '50.00',
          percentageOfCode: 'contractWage',
        },
        {
          structureId: salaryStructureId,
          code: 'HRA',
          name: 'House Rent Allowance (HRA)',
          category: 'allowance',
          sequence: 20,
          computationMethod: 'percentage',
          percentage: '50.00',
          percentageOfCode: 'BASIC',
        },
        {
          structureId: salaryStructureId,
          code: 'SPECIAL_ALLOWANCE',
          name: 'Special Allowance',
          category: 'allowance',
          sequence: 30,
          computationMethod: 'percentage',
          percentage: '30.00',
          percentageOfCode: 'BASIC',
        },
        {
          structureId: salaryStructureId,
          code: 'CONVEYANCE',
          name: 'Conveyance Allowance',
          category: 'allowance',
          sequence: 40,
          computationMethod: 'fixed',
          amount: '1600.00',
        },
        {
          structureId: salaryStructureId,
          code: 'MEDICAL',
          name: 'Medical Allowance',
          category: 'allowance',
          sequence: 50,
          computationMethod: 'fixed',
          amount: '1250.00',
        },
        {
          structureId: salaryStructureId,
          code: 'GROSS',
          name: 'Gross Earnings',
          category: 'gross',
          sequence: 100,
          computationMethod: 'formula',
          formula: 'BASIC + HRA + SPECIAL_ALLOWANCE + CONVEYANCE + MEDICAL',
        },
        {
          structureId: salaryStructureId,
          code: 'PF_EMP',
          name: 'Provident Fund (Employee PF)',
          category: 'deduction',
          sequence: 110,
          computationMethod: 'percentage',
          percentage: '12.00',
          percentageOfCode: 'BASIC',
        },
        {
          structureId: salaryStructureId,
          code: 'PROF_TAX',
          name: 'Professional Tax (PT)',
          category: 'deduction',
          sequence: 120,
          computationMethod: 'fixed',
          amount: '200.00',
        },
        {
          structureId: salaryStructureId,
          code: 'TDS',
          name: 'Income Tax (TDS)',
          category: 'deduction',
          sequence: 130,
          computationMethod: 'fixed',
          amount: '2500.00',
        },
        {
          structureId: salaryStructureId,
          code: 'TOTAL_DEDUCTIONS',
          name: 'Total Deductions',
          category: 'deduction',
          sequence: 190,
          computationMethod: 'formula',
          formula: 'PF_EMP + PROF_TAX + TDS',
        },
        {
          structureId: salaryStructureId,
          code: 'NET',
          name: 'Net Payable Salary',
          category: 'net',
          sequence: 200,
          computationMethod: 'formula',
          formula: 'GROSS - TOTAL_DEDUCTIONS',
        },
      ];

      for (const r of rulesToSeed) {
        await db.insert(schema.salaryRules).values(r);
      }
    }
    console.info('✅ Salary Structure & Rules verified: STD_TECH_2026');

    // 8. Seed Employee Contracts
    const employeeList = await db
      .select({
        id: schema.employees.id,
        departmentId: schema.employees.departmentId,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
      })
      .from(schema.employees)
      .innerJoin(schema.users, eq(schema.employees.userId, schema.users.id));
    const wages: Record<string, string> = {
      'aarav@company.com': '90000.00',
      'maya@company.com': '85000.00',
      'rohan@company.com': '75000.00',
      'nisha@company.com': '120000.00',
      'vaibhav@odoo.com': '80000.00',
    };

    for (const emp of employeeList) {
      const existingContract = await db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.employeeId, emp.id))
        .limit(1);

      if (existingContract.length === 0) {
        const wage = wages[emp.email] || '80000.00';
        await db.insert(schema.contracts).values({
          employeeId: emp.id,
          name: `${emp.firstName} ${emp.lastName} - FY26 Employment Contract`,
          wage,
          wageType: 'monthly',
          salaryStructureId,
          workingScheduleId: scheduleId,
          departmentId: emp.departmentId,
          startDate: '2026-04-01',
          status: 'active',
          notes: 'Standard permanent full-time employment agreement',
        });
      }
    }
    console.info('✅ Employee Contracts verified');

    // 9. Seed Payruns & Payslips (June, July, August 2026)
    const periods = [
      { name: 'June 2026 Regular Payrun', start: '2026-06-01', end: '2026-06-30' },
      { name: 'July 2026 Regular Payrun', start: '2026-07-01', end: '2026-07-31' },
      { name: 'August 2026 Regular Payrun', start: '2026-08-01', end: '2026-08-31' },
    ];

    for (const p of periods) {
      const existingPayrun = await db
        .select()
        .from(schema.payruns)
        .where(eq(schema.payruns.periodStart, p.start))
        .limit(1);

      if (existingPayrun.length === 0) {
        const empIds = employeeList.map((e) => e.id);
        const { createPayrunWizard, validatePayrun, markPayrunPaid } =
          await import('../modules/payroll/payroll.service');

        const created = await createPayrunWizard({
          name: p.name,
          salaryStructureId,
          periodStart: p.start,
          periodEnd: p.end,
          employeeIds: empIds,
          notes: `Monthly regular payroll processing for ${p.name}`,
        });

        await validatePayrun(created.id);
        await markPayrunPaid(created.id);
        console.info(`✅ Seeded and finalized payrun: ${p.name}`);
      }
    }

    // 14. Seed Company Policies
    const initialPolicies = [
      {
        code: 'CODE_OF_CONDUCT',
        title: 'Code of Business Conduct & Ethics',
        category: 'compliance',
        version: '1.0',
        summary:
          'Sets mandatory standards for integrity, workplace respect, anti-bribery, conflict of interest disclosure, and ethical decision-making.',
        content: `### 1. Purpose and Philosophy
Anchorage Technologies Pvt. Ltd. is dedicated to conducting business with absolute honesty, transparency, and integrity. This Code of Business Conduct applies universally to all officers, directors, contractors, and full-time employees.

### 2. Fair Competition & Anti-Bribery
We strictly prohibit offering, giving, soliciting, or receiving bribes, kickbacks, or unlawful inducements. Employees must never accept personal gifts, travel, or entertainment from vendors or clients that exceed nominal hospitality value.

### 3. Conflicts of Interest
Employees must avoid situations where personal or financial relationships conflict with the company's best interests. Any outside consulting, secondary employment, or board memberships must be formally submitted and approved by HR & Legal.

### 4. Respect in the Workplace
Every individual is entitled to a professional environment free of harassment, discrimination, and bullying. We uphold equal employment opportunities irrespective of race, gender, religion, sexual orientation, disability, or marital status.

### 5. Compliance & Reporting
Violations of this Code will lead to disciplinary proceedings up to and including termination of employment. Suspected violations may be reported confidentially through our anonymous ethics reporting channel.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'INFO_SECURITY',
        title: 'Information Security & Data Privacy Policy',
        category: 'security',
        version: '1.2',
        summary:
          'Governs data protection protocols, confidential system access, multi-factor authentication, device encryption, and ISO 27001 / GDPR compliance.',
        content: `### 1. Information Classification
All corporate assets, databases, customer personal data, and source code repositories are designated as Confidential or Strictly Confidential.

### 2. Access Controls & Passwords
- Multi-factor authentication (MFA) is mandatory for all production systems, email accounts, and internal portals.
- Passwords must be at least 12 characters in length and updated per enterprise password lifecycle policies.
- Sharing credentials or API keys across team members or over unencrypted messaging tools is strictly forbidden.

### 3. Device & Endpoint Security
- Company-issued laptops must have full-disk encryption (FileVault/BitLocker) enabled and active at all times.
- Automated security patches must be installed within 7 calendar days of release.
- Connecting personal USB storage devices or unapproved peripherals to corporate workstations is blocked.

### 4. Incident Reporting
Any suspected security compromise, phishing email click, lost device, or data breach must be reported immediately to security@peoplepay360.com within two hours of discovery.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'POSH_POLICY',
        title: 'Prevention of Sexual Harassment (POSH) & Anti-Discrimination',
        category: 'compliance',
        version: '2.0',
        summary:
          'Comprehensive policy providing a safe, respectful environment free from sexual harassment, detailing the Internal Complaints Committee (ICC) redressal process.',
        content: `### 1. Zero Tolerance Mandate
Anchorage Technologies maintains a strict zero-tolerance policy against any form of sexual harassment, unwelcome verbal/physical conduct, visual harassment, or gender-based discrimination in the physical or digital workplace.

### 2. Definition of Workplace
The workplace includes all company premises, client sites, company-sponsored offsites, conferences, business travel, virtual video calls, and official corporate messaging channels.

### 3. Internal Complaints Committee (ICC)
Pursuant to statutory guidelines, an independent Internal Complaints Committee headed by a senior female presiding officer investigates all complaints with complete confidentiality and fairness.

### 4. Redressal & Protection Against Retaliation
- Formal complaints are acknowledged within 48 hours and investigated thoroughly within 30 days.
- Strict anti-retaliation protections ensure that complainants and witnesses are fully protected against any career or interpersonal repercussions.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'REMOTE_WORK',
        title: 'Remote & Hybrid Workplace Guidelines',
        category: 'workplace',
        version: '1.1',
        summary:
          'Operational expectations, core working hours, virtual meeting etiquette, communication cadence, and ergonomics for hybrid teams.',
        content: `### 1. Hybrid Model Overview
Full-time employees operate on a flexible hybrid model comprising structured core in-office days and remote work allowances coordinated with team leads.

### 2. Core Working Hours & Availability
- Team members are expected to be available for synchronous collaboration during core hours: 10:00 AM – 5:00 PM local time.
- Statuses on corporate messaging (Slack/Teams) should accurately reflect working, in a meeting, or away.

### 3. Home Workspace & Ergonomics
- Employees working remotely must ensure a quiet, private environment with a stable high-speed broadband connection.
- The company provides an initial home workstation subsidy to support ergonomic chairs, external monitors, and accessories.

### 4. Virtual Etiquette
Video cameras are encouraged during internal 1-on-1s and customer presentations to foster strong team bonding and active engagement.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'IP_CONFIDENTIALITY',
        title: 'Intellectual Property, Inventions & Confidentiality Agreement',
        category: 'compliance',
        version: '1.0',
        summary:
          'Protects proprietary company software, customer datasets, patents, and confirms invention assignment developed during employment.',
        content: `### 1. Ownership of Inventions
All software, algorithms, designs, documentation, patents, and business methodologies created by employees during the course of employment are the exclusive proprietary property of the company ("Work Made for Hire").

### 2. Non-Disclosure Obligations
Employees agree never to disclose non-public company trade secrets, pricing formulas, client lists, or technological architectures to any third party during or following their term of employment.

### 3. Open Source Usage
Any integration of open source software (OSS) into company products must comply with enterprise licensing policies (permissive licenses like MIT/Apache 2.0; copyleft licenses like GPL require explicit CTO sign-off).

### 4. Return of Company Property
Upon separation, employees must immediately surrender all hardware, access tokens, customer files, and proprietary records in their possession.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
      {
        code: 'LEAVE_ATTENDANCE',
        title: 'Leave, Working Hours & Attendance Regularization Policy',
        category: 'hr',
        version: '1.0',
        summary:
          'Defines daily check-in protocols, shift schedules, paid time off accruals, compensatory leaves, and regularization procedures.',
        content: `### 1. Standard Working Schedule
Standard working hours consist of 40 hours per week across Monday to Friday, with 8 working hours and a mandatory 1-hour lunch break per day.

### 2. Attendance Recording
- Employees must record their daily Check-In and Check-Out through the PeoplePay360 portal or biometric attendance station.
- Punches submitted after 10:00 AM without prior manager notice are flagged as Late Arrivals.

### 3. Time Off Approvals
- Planned leaves (Paid Time Off, Vacation) must be requested at least 3 business days in advance through the Time Off portal.
- Sick Leave can be applied on the day of absence, with medical certification required for absences exceeding two consecutive days.

### 4. Attendance Regularization
Manual punch corrections for missed check-ins or biometric failures must be submitted within 3 business days and require manager approval before the monthly payroll cut-off.`,
        isMandatory: true,
        effectiveDate: '2026-04-01',
      },
    ];

    for (const pol of initialPolicies) {
      const [existing] = await db
        .select()
        .from(schema.companyPolicies)
        .where(eq(schema.companyPolicies.code, pol.code))
        .limit(1);

      if (!existing) {
        await db.insert(schema.companyPolicies).values(pol);
        console.info(`✅ Seeded policy: ${pol.title} (${pol.code})`);
      }
    }

    // 9. Seed Time Off Types
    const initialTimeOffTypes = [
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
        name: 'Unpaid Leave (LWP)',
        code: 'UNPAID',
        unit: 'days',
        requiresAllocation: false,
        approvalType: 'manager_and_hr',
        isPaid: false,
        isActive: true,
      },
    ];

    const typeMap = new Map<string, string>();

    for (const tot of initialTimeOffTypes) {
      const [existing] = await db
        .select()
        .from(schema.timeOffTypes)
        .where(eq(schema.timeOffTypes.code, tot.code))
        .limit(1);

      if (!existing) {
        const [inserted] = await db.insert(schema.timeOffTypes).values(tot).returning();
        typeMap.set(tot.code, inserted.id);
        console.info(`✅ Seeded time off type: ${tot.name} (${tot.code})`);
      } else {
        typeMap.set(tot.code, existing.id);
      }
    }

    // 10. Seed default allocations for existing employees
    const allEmployees = await db.select({ id: schema.employees.id }).from(schema.employees);
    const currYear = new Date().getFullYear();
    const validFrom = `${currYear}-01-01`;
    const validTo = `${currYear}-12-31`;

    const quotaDefaults = [
      { code: 'ANNUAL', amount: '20.0' },
      { code: 'SICK', amount: '10.0' },
      { code: 'CASUAL', amount: '5.0' },
    ];

    for (const emp of allEmployees) {
      for (const q of quotaDefaults) {
        const typeId = typeMap.get(q.code);
        if (!typeId) continue;

        const [existingAlloc] = await db
          .select()
          .from(schema.timeOffAllocations)
          .where(
            and(
              eq(schema.timeOffAllocations.employeeId, emp.id),
              eq(schema.timeOffAllocations.timeOffTypeId, typeId),
              eq(schema.timeOffAllocations.validFrom, validFrom),
            ),
          )
          .limit(1);

        if (!existingAlloc) {
          await db.insert(schema.timeOffAllocations).values({
            employeeId: emp.id,
            timeOffTypeId: typeId,
            allocatedAmount: q.amount,
            takenAmount: '0.0',
            remainingAmount: q.amount,
            validFrom,
            validTo,
            status: 'approved',
          });
        }
      }
    }
    console.info(`✅ Seeded default leave allocations for ${allEmployees.length} employees`);

    console.info(
      `✅ Seeded ${sampleEmployees.length} sample employee accounts (password: ${staffPassword})`,
    );
    console.info('🎉 Seeding completed successfully!');
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
    .catch(() => process.exit(1));
}
