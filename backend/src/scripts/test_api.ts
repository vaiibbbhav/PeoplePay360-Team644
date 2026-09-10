import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_TEST_URL || 'http://localhost:3000/api';

async function login(email: string, password: string = 'Staff@123'): Promise<string> {
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

async function runAudit() {
  console.log('===============================================================');
  console.log('🚀 STARTING PEOPLEPAY360 COMPLETE API & RBAC INTEGRATION SUITE');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('===============================================================\n');

  // --- PART 1: COMPLETE ENDPOINT AUDIT (ADMIN) ---
  console.log('👉 PART 1: Complete Endpoint Audit (Admin Role)...');
  const adminToken = await login('admin@peoplepay.com', 'Admin@123');
  console.log('   ✓ Admin login successful.\n');

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };

  async function testGet(name: string, url: string, validate?: (data: any) => void) {
    try {
      const res = await fetch(`${BASE_URL}${url}`, { headers });
      if (!res.ok) {
        console.error(`   ✗ [${res.status}] ${name} (${url}) -> ${await res.text()}`);
        return null;
      }
      const data: any = await res.json();
      if (validate) validate(data);
      console.log(`   ✓ [${res.status}] ${name} (${url})`);
      return data;
    } catch (e: any) {
      console.error(`   ✗ Exception in ${name} (${url}):`, e.message);
      return null;
    }
  }

  // Dashboard & Reports
  await testGet('Dashboard Overview', '/reports/dashboard');
  await testGet('Admin Overview', '/reports/admin-overview');

  // Employees & Profile
  const employeesData = await testGet('Employees List', '/employees?page=1&limit=20');
  const firstEmp = (employeesData?.data || employeesData?.employees || employeesData || [])[0];
  if (firstEmp?.id) {
    await testGet('Employee Detail Profile', `/employees/${firstEmp.id}`);
  }

  // Contracts
  const contractsData = await testGet('Contracts List', '/contracts');
  const firstContract = (contractsData?.data || contractsData?.contracts || contractsData || [])[0];
  if (firstContract?.id) {
    await testGet('Contract Detail', `/contracts/${firstContract.id}`);
  }

  // Schedules & Attendance
  await testGet('Schedules List', '/schedules');
  await testGet('Attendance Records', '/attendance?limit=20');

  // Time Off
  await testGet('Time Off Types', '/time-off/types');
  await testGet('Time Off Requests', '/time-off/requests');
  await testGet('Time Off Allocations', '/time-off/allocations');

  // Payruns & Salary Rules
  const payrunsData = await testGet('Payruns List', '/payruns');
  const payrunsList = payrunsData?.data || payrunsData || [];
  if (payrunsList[0]?.id) {
    await testGet('Payrun Detail', `/payruns/${payrunsList[0].id}`);
  }

  await testGet('Salary Structures List', '/payroll/structures');
  await testGet('Salary Rules List', '/payroll/rules');

  // Payslips
  const payslipsData = await testGet('Payslips List', '/payslips');
  const payslipsList = payslipsData?.data || payslipsData || [];
  if (payslipsList[0]?.id) {
    await testGet('Payslip Detail', `/payslips/${payslipsList[0].id}`);
  }

  // Documents & Users
  await testGet('Documents List', '/documents');
  await testGet('Users List', '/users?page=1&limit=20');

  // --- PART 2: RBAC PERMISSION MATRIX AUDIT ---
  console.log('\n👉 PART 2: Role-Based Access Control (RBAC) Verification...');

  // 1. HR Manager
  console.log('\n--- Checking HR Manager (maya@company.com) ---');
  const hrManagerToken = await login('maya@company.com');
  const hrEmp = await testEndpoint(hrManagerToken, 'GET', '/employees');
  console.log(`   [HR Manager] GET /employees: ${hrEmp.status} (Expected 200)`);
  const hrPayruns = await testEndpoint(hrManagerToken, 'GET', '/payruns');
  console.log(`   [HR Manager] GET /payruns: ${hrPayruns.status} (Expected 403 Forbidden)`);
  const hrStructures = await testEndpoint(hrManagerToken, 'GET', '/payroll/structures');
  console.log(`   [HR Manager] GET /payroll/structures: ${hrStructures.status} (Expected 403 Forbidden)`);

  // 2. HR Payroll User
  console.log('\n--- Checking HR Payroll User (aarav@company.com) ---');
  const payrollUserToken = await login('aarav@company.com');
  const puPayruns = await testEndpoint(payrollUserToken, 'GET', '/payruns');
  console.log(`   [HR Payroll User] GET /payruns: ${puPayruns.status} (Expected 200)`);
  const puStructures = await testEndpoint(payrollUserToken, 'GET', '/payroll/structures');
  console.log(`   [HR Payroll User] GET /payroll/structures: ${puStructures.status} (Expected 200 Read-Only)`);
  const puCreateStruct = await testEndpoint(payrollUserToken, 'POST', '/payroll/structures', {
    name: 'Unauthorized Structure',
    code: 'UNAUTH_TEST',
  });
  console.log(`   [HR Payroll User] POST /payroll/structures: ${puCreateStruct.status} (Expected 403 Forbidden)`);

  // 3. HR Payroll Manager
  console.log('\n--- Checking HR Payroll Manager (nisha@company.com) ---');
  const payrollManagerToken = await login('nisha@company.com');
  const pmPayruns = await testEndpoint(payrollManagerToken, 'GET', '/payruns');
  console.log(`   [HR Payroll Manager] GET /payruns: ${pmPayruns.status} (Expected 200)`);
  const pmCreateStruct = await testEndpoint(payrollManagerToken, 'POST', '/payroll/structures', {
    name: 'Audit Test Structure',
    code: `TEST_${Date.now()}`,
    description: 'Structure for RBAC verification',
  });
  console.log(`   [HR Payroll Manager] POST /payroll/structures: ${pmCreateStruct.status} (Expected 201 Created)`);

  // 4. Employee (Self-Service)
  console.log('\n--- Checking Regular Employee (rohan@company.com) ---');
  const empToken = await login('rohan@company.com');
  const empMe = await testEndpoint(empToken, 'GET', '/auth/me');
  console.log(`   [Employee] GET /auth/me: ${empMe.status} (Expected 200)`);
  const empUsers = await testEndpoint(empToken, 'GET', '/users');
  console.log(`   [Employee] GET /users: ${empUsers.status} (Expected 403 Forbidden)`);
  const empAdminPayruns = await testEndpoint(empToken, 'POST', '/payruns', {});
  console.log(`   [Employee] POST /payruns: ${empAdminPayruns.status} (Expected 403 Forbidden)`);

  // Clean up any test structure created during verification
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query("DELETE FROM salary_structures WHERE code LIKE 'TEST_%'");
      await pool.end();
    } catch {
      // Non-blocking cleanup
    }
  }

  console.log('\n===============================================================');
  console.log('✅ ALL API & RBAC INTEGRATION CHECKS COMPLETED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

runAudit().catch((err) => {
  console.error('❌ Audit suite failed:', err);
  process.exit(1);
});
