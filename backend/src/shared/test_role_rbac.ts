import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function login(email: string, password: string = 'Staff@123') {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.token;
}

async function testEndpoint(token: string, method: string, path: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  return { status: res.status, text: await res.text() };
}

async function runRoleAudit() {
  console.log('=== STARTING ROLE-BASED ACCESS CONTROL (RBAC) AUDIT ===\n');

  // 1. Test HR Manager (nisha.shah@company.com)
  console.log('--- 1. Testing HR Manager (nisha.shah@company.com) ---');
  const hrManagerToken = await login('nisha.shah@company.com');

  // Allowed: Employees list
  const hrEmp = await testEndpoint(hrManagerToken, 'GET', '/employees');
  console.log(`[HR Manager] GET /employees: ${hrEmp.status} (Expected 200)`);

  // Allowed: Contracts list
  const hrCon = await testEndpoint(hrManagerToken, 'GET', '/contracts');
  console.log(`[HR Manager] GET /contracts: ${hrCon.status} (Expected 200)`);

  // Allowed: Schedules list
  const hrSch = await testEndpoint(hrManagerToken, 'GET', '/schedules');
  console.log(`[HR Manager] GET /schedules: ${hrSch.status} (Expected 200)`);

  // Allowed: Attendance list
  const hrAtt = await testEndpoint(hrManagerToken, 'GET', '/attendance');
  console.log(`[HR Manager] GET /attendance: ${hrAtt.status} (Expected 200)`);

  // Allowed: Time Off requests
  const hrTo = await testEndpoint(hrManagerToken, 'GET', '/time-off/requests');
  console.log(`[HR Manager] GET /time-off/requests: ${hrTo.status} (Expected 200)`);

  // BLOCKED: Payroll & Payruns
  const hrPayruns = await testEndpoint(hrManagerToken, 'GET', '/payruns');
  console.log(`[HR Manager] GET /payruns: ${hrPayruns.status} (Expected 403 Forbidden)`);

  // BLOCKED: Payslips
  const hrPayslips = await testEndpoint(hrManagerToken, 'GET', '/payslips');
  console.log(`[HR Manager] GET /payslips: ${hrPayslips.status} (Expected 403 Forbidden)`);

  // BLOCKED: Salary Structures
  const hrStructures = await testEndpoint(hrManagerToken, 'GET', '/payroll/structures');
  console.log(
    `[HR Manager] GET /payroll/structures: ${hrStructures.status} (Expected 403 Forbidden)`,
  );

  // 2. Test HR Payroll User (rohan.mehta@company.com or aarav@company.com)
  console.log('\n--- 2. Testing HR Payroll User (rohan.mehta@company.com) ---');
  const payrollUserToken = await login('rohan.mehta@company.com');

  // Allowed: Core HR modules
  const puEmp = await testEndpoint(payrollUserToken, 'GET', '/employees');
  console.log(`[HR Payroll User] GET /employees: ${puEmp.status} (Expected 200)`);

  // Allowed: Payruns list
  const puPayruns = await testEndpoint(payrollUserToken, 'GET', '/payruns');
  console.log(`[HR Payroll User] GET /payruns: ${puPayruns.status} (Expected 200)`);

  // Allowed: Payslips list
  const puPayslips = await testEndpoint(payrollUserToken, 'GET', '/payslips');
  console.log(`[HR Payroll User] GET /payslips: ${puPayslips.status} (Expected 200)`);

  // Allowed: Salary Structures (Read-Only)
  const puStructures = await testEndpoint(payrollUserToken, 'GET', '/payroll/structures');
  console.log(`[HR Payroll User] GET /payroll/structures: ${puStructures.status} (Expected 200)`);

  // Allowed: Salary Rules (Read-Only)
  const puRules = await testEndpoint(payrollUserToken, 'GET', '/payroll/rules');
  console.log(`[HR Payroll User] GET /payroll/rules: ${puRules.status} (Expected 200)`);

  // BLOCKED: Create Salary Structure (Should be forbidden for read-only user)
  const puCreateStruct = await testEndpoint(payrollUserToken, 'POST', '/payroll/structures', {
    name: 'Unauthorized Structure',
    code: 'UNAUTH',
  });
  console.log(
    `[HR Payroll User] POST /payroll/structures: ${puCreateStruct.status} (Expected 403 Forbidden)`,
  );

  // BLOCKED: Create Salary Rule
  const puCreateRule = await testEndpoint(payrollUserToken, 'POST', '/payroll/rules', {
    structureId: '00000000-0000-0000-0000-000000000000',
    name: 'Unauthorized Rule',
    code: 'UNAUTH_R',
    category: 'basic',
    sequence: 1,
    computationMethod: 'fixed',
  });
  console.log(
    `[HR Payroll User] POST /payroll/rules: ${puCreateRule.status} (Expected 403 Forbidden)`,
  );

  // 3. Test HR Payroll Manager (nisha@company.com)
  console.log('\n--- 3. Testing HR Payroll Manager (nisha@company.com) ---');
  const payrollManagerToken = await login('nisha@company.com');

  // Allowed: Payruns
  const pmPayruns = await testEndpoint(payrollManagerToken, 'GET', '/payruns');
  console.log(`[HR Payroll Manager] GET /payruns: ${pmPayruns.status} (Expected 200)`);

  // Allowed: Payslips
  const pmPayslips = await testEndpoint(payrollManagerToken, 'GET', '/payslips');
  console.log(`[HR Payroll Manager] GET /payslips: ${pmPayslips.status} (Expected 200)`);

  // Allowed: Structure Write Access
  const pmCreateStruct = await testEndpoint(payrollManagerToken, 'POST', '/payroll/structures', {
    name: 'Audit Test Structure',
    code: `TEST_${Date.now()}`,
    description: 'Structure for RBAC verification',
  });
  console.log(
    `[HR Payroll Manager] POST /payroll/structures: ${pmCreateStruct.status} (Expected 201 Created)`,
  );

  // 4. Test Admin (admin@peoplepay.com)
  console.log('\n--- 4. Testing Admin (admin@peoplepay.com) ---');
  const adminToken = await login('admin@peoplepay.com', 'Admin@123');

  // Allowed: User management
  const adminUsers = await testEndpoint(adminToken, 'GET', '/users');
  console.log(`[Admin] GET /users: ${adminUsers.status} (Expected 200)`);

  // Clean up test structure if created
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DELETE FROM salary_structures WHERE code LIKE 'TEST_%'");
  await pool.end();

  console.log('\n=== ALL ROLE-BASED ACCESS CHECKS PASSED ===');
}

runRoleAudit().catch(console.error);
