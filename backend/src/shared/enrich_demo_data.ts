import 'dotenv/config';
import { db } from './db';
import * as schema from '../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

async function enrichDemoData() {
  console.log('🚀 Starting demo data enrichment...');

  // 1. Fetch all employees ordered by id
  const allEmployees = await db
    .select({
      id: schema.employees.id,
      userId: schema.employees.userId,
      employmentStatus: schema.employees.employmentStatus,
      departmentId: schema.employees.departmentId,
      jobPositionId: schema.employees.jobPositionId,
    })
    .from(schema.employees)
    .limit(125);

  console.log(`Found ${allEmployees.length} employees`);

  if (allEmployees.length < 35) {
    console.warn('Fewer than 35 employees, skipping partial distribution');
    process.exit(0);
  }

  // Pick specific slices:
  // indices 0..14: Management tier (Nisha, Aarav, etc.) -> Keep active!
  // indices 15..22 (8 employees): On Leave
  // indices 23..27 (5 employees): Inactive
  // indices 28..32 (5 employees): Terminated
  // remaining: Active

  const onLeaveEmployees = allEmployees.slice(15, 23);
  const inactiveEmployees = allEmployees.slice(23, 28);
  const terminatedEmployees = allEmployees.slice(28, 33);
  const activeEmployees = [...allEmployees.slice(0, 15), ...allEmployees.slice(33)];

  console.log(`Setting:
- Active: ${activeEmployees.length}
- On Leave: ${onLeaveEmployees.length}
- Inactive: ${inactiveEmployees.length}
- Terminated: ${terminatedEmployees.length}`);

  // Update On Leave employees
  for (const emp of onLeaveEmployees) {
    await db
      .update(schema.employees)
      .set({ employmentStatus: 'on_leave' })
      .where(eq(schema.employees.id, emp.id));
  }

  // Update Inactive employees
  for (const emp of inactiveEmployees) {
    await db
      .update(schema.employees)
      .set({ employmentStatus: 'inactive' })
      .where(eq(schema.employees.id, emp.id));

    // Deactivate user account for 3 of them
    await db.update(schema.users).set({ isActive: false }).where(eq(schema.users.id, emp.userId));
  }

  // Update Terminated employees
  for (const emp of terminatedEmployees) {
    await db
      .update(schema.employees)
      .set({ employmentStatus: 'terminated' })
      .where(eq(schema.employees.id, emp.id));

    // Deactivate user account
    await db.update(schema.users).set({ isActive: false }).where(eq(schema.users.id, emp.userId));

    // Terminate their contract
    await db
      .update(schema.contracts)
      .set({
        status: 'terminated',
        endDate: '2026-08-15',
        notes: 'Resigned and relieved following handover completion.',
      })
      .where(eq(schema.contracts.employeeId, emp.id));
  }

  // 2. Ensure Time Off Requests exist for the On Leave employees covering TODAY (2026-09-06)
  const timeOffTypes = await db.select().from(schema.timeOffTypes).limit(5);
  const annualLeaveType =
    timeOffTypes.find(
      (t) => t.name.toLowerCase().includes('annual') || t.name.toLowerCase().includes('paid'),
    ) || timeOffTypes[0];
  const sickLeaveType =
    timeOffTypes.find((t) => t.name.toLowerCase().includes('sick')) || timeOffTypes[1];

  if (annualLeaveType) {
    for (let i = 0; i < onLeaveEmployees.length; i++) {
      const emp = onLeaveEmployees[i];
      const selectedType = i % 2 === 0 ? annualLeaveType : sickLeaveType || annualLeaveType;

      // Check if existing request covers today
      const existing = await db
        .select()
        .from(schema.timeOffRequests)
        .where(eq(schema.timeOffRequests.employeeId, emp.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(schema.timeOffRequests)
          .set({
            status: 'approved',
            startDate: '2026-09-01',
            endDate: '2026-09-18',
            duration: '14.0',
            reason:
              i % 2 === 0
                ? 'Annual family sabbatical and vacation'
                : 'Medical recovery and doctor recommended rest',
          })
          .where(eq(schema.timeOffRequests.id, existing[0].id));
      } else {
        await db.insert(schema.timeOffRequests).values({
          employeeId: emp.id,
          timeOffTypeId: selectedType.id,
          startDate: '2026-09-01',
          endDate: '2026-09-18',
          duration: '14.0',
          status: 'approved',
          reason:
            i % 2 === 0
              ? 'Annual family sabbatical and vacation'
              : 'Medical recovery and doctor recommended rest',
        });
      }
    }
    console.log('✅ Synchronized active leave requests for all 8 on-leave employees');
  }

  // 3. Contracts Status Diversity: Add Draft (6) and Expired (4) contracts
  const structures = await db.select().from(schema.salaryStructures).limit(2);
  const defaultStructureId = structures[0]?.id;

  // Insert 4 expired historical contracts
  for (let i = 0; i < 4; i++) {
    const emp = activeEmployees[i + 5];
    await db.insert(schema.contracts).values({
      employeeId: emp.id,
      name: `Historical Contract — 2024/2025`,
      wage: '65000.00',
      wageType: 'monthly',
      salaryStructureId: defaultStructureId,
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      status: 'expired',
      notes: 'Prior multi-year employment contract expired and superseded.',
    });
  }
  console.log('✅ Created 4 expired contracts');

  // Insert 6 draft renewal contracts
  for (let i = 0; i < 6; i++) {
    const emp = activeEmployees[i + 12];
    await db.insert(schema.contracts).values({
      employeeId: emp.id,
      name: `FY2027 Promotion & Compensation Revision (Draft)`,
      wage: '95000.00',
      wageType: 'monthly',
      salaryStructureId: defaultStructureId,
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      startDate: '2026-10-01',
      endDate: '2027-09-30',
      status: 'draft',
      notes: 'Upcoming compensation revision undergoing executive review.',
    });
  }
  console.log('✅ Created 6 draft renewal contracts');

  // 4. Attendance Data Diversity: Add Absent and Overtime entries
  const schedules = await db.select().from(schema.workingSchedules).limit(1);
  const sampleEmployeesForAttendance = activeEmployees.slice(20, 40);

  for (let i = 0; i < 8; i++) {
    const emp = sampleEmployeesForAttendance[i];
    // Check if attendance exists on 2026-09-05
    try {
      await db.insert(schema.attendance).values({
        employeeId: emp.id,
        date: '2026-09-05',
        checkIn: new Date('2026-09-05T08:30:00Z'),
        checkOut: new Date('2026-09-05T19:30:00Z'),
        workedHours: '10.00',
        status: 'Overtime',
        isManualEdit: false,
      });
    } catch {
      // Ignored if duplicate date
    }
  }

  for (let i = 8; i < 16; i++) {
    const emp = sampleEmployeesForAttendance[i];
    try {
      await db.insert(schema.attendance).values({
        employeeId: emp.id,
        date: '2026-09-05',
        checkIn: new Date('2026-09-05T09:00:00Z'),
        checkOut: new Date('2026-09-05T09:00:00Z'),
        workedHours: '0.00',
        status: 'Absent',
        isManualEdit: false,
      });
    } catch {
      // Ignored if duplicate date
    }
  }
  console.log('✅ Added Overtime and Absent attendance records');

  // 5. Payrun Lifecycle Demonstration
  // Check if draft payrun exists
  const existingDraft = await db
    .select()
    .from(schema.payruns)
    .where(eq(schema.payruns.status, 'draft'))
    .limit(1);

  if (existingDraft.length === 0 && defaultStructureId) {
    await db.insert(schema.payruns).values({
      name: 'Payrun — October 2026 (Upcoming Cycle)',
      salaryStructureId: defaultStructureId,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      status: 'draft',
      totalBasic: '0.00',
      totalGross: '0.00',
      totalDeductions: '0.00',
      totalNet: '0.00',
      payslipCount: 0,
      warnings: [],
    });
    console.log('✅ Created draft payrun for demonstration');
  }

  // Check if computed payrun exists
  const existingComputed = await db
    .select()
    .from(schema.payruns)
    .where(eq(schema.payruns.status, 'computed'))
    .limit(1);

  if (existingComputed.length === 0 && defaultStructureId) {
    const [computedRun] = await db
      .insert(schema.payruns)
      .values({
        name: 'Payrun — September 2026 (Ready to Validate)',
        salaryStructureId: defaultStructureId,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        status: 'computed',
        totalBasic: '1250000.00',
        totalGross: '1850000.00',
        totalDeductions: '215000.00',
        totalNet: '1635000.00',
        payslipCount: 15,
        warnings: [
          {
            severity: 'attention',
            message: '3 employees have pending leave requests awaiting approval.',
          },
          {
            severity: 'attention',
            message: '1 employee contract renewal starts in this pay period.',
          },
        ],
      })
      .returning();

    // Create 15 sample payslips for the computed payrun
    const activeContracts = await db
      .select({
        id: schema.contracts.id,
        employeeId: schema.contracts.employeeId,
        wage: schema.contracts.wage,
        structureId: schema.contracts.salaryStructureId,
      })
      .from(schema.contracts)
      .where(eq(schema.contracts.status, 'active'))
      .limit(15);

    for (const c of activeContracts) {
      const wageNum = parseFloat(c.wage);
      const basic = Math.round(wageNum * 0.5);
      const gross = Math.round(wageNum * 1.2);
      const ded = Math.round(wageNum * 0.12);
      const net = gross - ded;

      await db.insert(schema.payslips).values({
        payrunId: computedRun.id,
        employeeId: c.employeeId,
        contractId: c.id,
        structureId: c.structureId || defaultStructureId,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        workedDays: '22.00',
        basicSalary: String(basic),
        grossSalary: String(gross),
        totalDeductions: String(ded),
        netSalary: String(net),
        status: 'draft',
        warnings: [],
      });
    }
    console.log(
      '✅ Created computed payrun with 15 payslips and warnings (ready to validate & pay)',
    );
  }

  console.log('🎉 Demo data enrichment complete!');
  process.exit(0);
}

enrichDemoData().catch((err) => {
  console.error('❌ Enrichment error:', err);
  process.exit(1);
});
