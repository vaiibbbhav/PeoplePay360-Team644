import { db } from './db';
import { users, employees, payruns, payslips, contracts } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- USERS WITH devanshnair ---');
  const u = await db.select().from(users).where(eq(users.email, 'devanshnair.05@gmail.com'));
  console.log('User devanshnair:', u);

  console.log('--- ALL PAYRUNS ---');
  const prs = await db.select().from(payruns);
  console.log('Payruns:', prs.map(p => ({ id: p.id, name: p.name, status: p.status, periodStart: p.periodStart, periodEnd: p.periodEnd })));

  console.log('--- SAMPLE EMPLOYEES ---');
  const emps = await db.select({
    id: employees.id,
    userId: employees.userId,
    badgeId: employees.badgeId,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName
  }).from(employees).leftJoin(users, eq(employees.userId, users.id)).limit(10);
  console.log('Sample Employees:', emps);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
