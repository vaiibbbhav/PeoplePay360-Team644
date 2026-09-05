import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { pool, db, closeDb } from './db';
import * as schema from '../db/schema';
import { passwordSchema } from '../modules/auth/auth.validators';

export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.info('🌱 Starting PeoplePay360 database seed...');

    // 1. Ensure columns exist on `users` and `employees` tables
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
      ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
      ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT 'Employee';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) DEFAULT 'User';
      ALTER TABLE employees ALTER COLUMN user_id DROP NOT NULL;
    `);

    // 1b. Ensure `fingerprint` table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS fingerprint (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
        encryted_template TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        key_version VARCHAR(20) NOT NULL DEFAULT 'v1',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
      await db.insert(schema.users).values({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'Admin',
        isActive: true,
      });
      console.info(`✅ Admin user created: ${adminEmail} (password: ${adminRawPassword})`);
    } else {
      await db
        .update(schema.users)
        .set({
          passwordHash: adminPasswordHash,
          role: 'Admin',
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingAdmin[0].id));
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

    // 6. Seed Sample Employees (from wireframe)
    const sampleEmployees = [
      {
        firstName: 'Aarav',
        lastName: 'Mehta',
        email: 'aarav@company.com',
        departmentId: deptMap['Technology'],
        role: 'HR Payroll User' as const,
      },
      {
        firstName: 'Maya',
        lastName: 'Shah',
        email: 'maya@company.com',
        departmentId: deptMap['HR & Operations'],
        role: 'HR Manager' as const,
      },
      {
        firstName: 'Rohan',
        lastName: 'Patel',
        email: 'rohan@company.com',
        departmentId: deptMap['Technology'],
        role: 'Employee' as const,
      },
      {
        firstName: 'Nisha',
        lastName: 'Rao',
        email: 'nisha@company.com',
        departmentId: deptMap['Management'],
        role: 'HR Payroll Manager' as const,
      },
      {
        firstName: 'Vaibhav',
        lastName: 'Patel',
        email: 'vaibhav@odoo.com',
        departmentId: deptMap['Technology'],
        role: 'Employee' as const,
        customPassword: '12345678',
      },
    ];

    const staffPassword = 'Staff@123';
    const staffPasswordHash = await bcrypt.hash(staffPassword, salt);

    for (const emp of sampleEmployees) {
      const passwordHashToUse = emp.customPassword
        ? await bcrypt.hash(emp.customPassword, salt)
        : staffPasswordHash;

      // Find or create employee
      let employeeId: string;
      const existingEmp = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.email, emp.email))
        .limit(1);

      if (existingEmp.length > 0) {
        employeeId = existingEmp[0].id;
        await db
          .update(schema.employees)
          .set({
            bankName: 'HDFC Bank',
            bankAccountNumber: '50100492819283',
            bankRoutingCode: 'HDFC0001234',
            identificationNumber: 'ABCDE1234F',
            employmentStatus: 'active',
          })
          .where(eq(schema.employees.id, employeeId));
      } else {
        const [newEmp] = await db
          .insert(schema.employees)
          .values({
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            departmentId: emp.departmentId,
            workingScheduleId: scheduleId,
            employmentStatus: 'active',
            bankName: 'HDFC Bank',
            bankAccountNumber: '50100492819283',
            bankRoutingCode: 'HDFC0001234',
            identificationNumber: 'ABCDE1234F',
          })
          .returning();
        employeeId = newEmp.id;
      }

      // Upsert User linked to employee
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, emp.email))
        .limit(1);

      if (existingUser.length === 0) {
        await db.insert(schema.users).values({
          email: emp.email,
          passwordHash: passwordHashToUse,
          role: emp.role,
          employeeId,
          isActive: true,
        });
      } else {
        await db
          .update(schema.users)
          .set({
            role: emp.role,
            employeeId,
            passwordHash: passwordHashToUse,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existingUser[0].id));
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
    const employeeList = await db.select().from(schema.employees);
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
