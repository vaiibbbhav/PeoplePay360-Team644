import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { pool, db, closeDb } from './db';
import * as schema from '../db/schema';
import { passwordSchema } from '../modules/auth/auth.validators';

export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.info('🌱 Starting PeoplePay360 database seed...');

    // 1. Ensure `is_active` column exists on `users` table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
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
    ];

    const staffPassword = 'Staff@123';
    const staffPasswordHash = await bcrypt.hash(staffPassword, salt);

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
      const existingEmp = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.userId, userId))
        .limit(1);

      if (existingEmp.length === 0) {
        await db.insert(schema.employees).values({
          userId,
          departmentId: emp.departmentId,
          workingScheduleId: scheduleId,
          employmentStatus: 'active',
        });
      } else {
        await db
          .update(schema.employees)
          .set({
            departmentId: emp.departmentId,
            workingScheduleId: scheduleId,
            employmentStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(schema.employees.id, existingEmp[0].id));
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
