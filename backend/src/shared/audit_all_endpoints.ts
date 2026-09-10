const BASE_URL = 'http://localhost:3000/api';

async function runAudit() {
  console.log('=== STARTING COMPLETE ENDPOINT AUDIT ===\n');

  // 1. Authenticate as Admin
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@peoplepay.com', password: 'Admin@123' }),
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData: any = await loginRes.json();
  const token = loginData.token;
  console.log('   ✓ Logged in successfully. Token obtained.\n');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Helper to test an endpoint
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

  // 2. Test Reports / Dashboard Endpoints
  console.log('2. Auditing Dashboard & Reports endpoints...');
  await testGet('Dashboard Overview', '/reports/dashboard', (d) => {
    console.log(
      `     - Total Net Paid: ${d.kpis?.totalNetPaid}, Avg Salary: ${d.kpis?.averageSalary}, Present: ${d.attendance?.present}`,
    );
  });
  await testGet('Admin Overview', '/reports/admin-overview', (d) => {
    console.log(
      `     - Deactivated Accounts: ${d.attention?.deactivatedAccounts?.totalCount}, Incomplete: ${d.attention?.incompleteProfiles?.count}`,
    );
  });

  // 3. Test Employees
  console.log('\n3. Auditing Employees endpoints...');
  const employeesData = await testGet('Employees List', '/employees?page=1&limit=50', (d) => {
    const list = d.data || d.employees || d;
    console.log(
      `     - Total employees returned: ${list.length}, total count: ${d.total || list.length}`,
    );
  });
  const firstEmp = (employeesData?.data || employeesData?.employees || employeesData || [])[0];
  if (firstEmp?.id) {
    await testGet('Employee Detail Profile', `/employees/${firstEmp.id}`);
  }

  // 4. Test Contracts
  console.log('\n4. Auditing Contracts endpoints...');
  const contractsData = await testGet('Contracts List', '/contracts', (d) => {
    const list = d.data || d.contracts || d;
    console.log(`     - Total contracts returned: ${list.length}`);
  });
  const firstContract = (contractsData?.data || contractsData?.contracts || contractsData || [])[0];
  if (firstContract?.id) {
    await testGet('Contract Detail', `/contracts/${firstContract.id}`);
  }

  // 5. Test Working Schedules
  console.log('\n5. Auditing Schedules endpoints...');
  await testGet('Schedules List', '/schedules', (d) => {
    const list = d.data || d.schedules || d;
    console.log(`     - Total schedules returned: ${list.length}`);
  });

  // 6. Test Attendance
  console.log('\n6. Auditing Attendance endpoints...');
  await testGet('Attendance Records', '/attendance?limit=20', (d) => {
    const list = d.data || d.records || d;
    console.log(`     - Total records returned: ${list.length}`);
  });

  // 7. Test Time Off
  console.log('\n7. Auditing Time Off endpoints...');
  await testGet('Time Off Types', '/time-off/types', (d) => {
    console.log(`     - Types count: ${d.length || (d.data && d.data.length)}`);
  });
  await testGet('Time Off Requests', '/time-off/requests', (d) => {
    console.log(`     - Requests count: ${d.length || (d.data && d.data.length)}`);
  });
  await testGet('Time Off Allocations', '/time-off/allocations', (d) => {
    console.log(`     - Allocations count: ${d.length || (d.data && d.data.length)}`);
  });

  // 8. Test Payroll & Payruns
  console.log('\n8. Auditing Payroll & Payruns endpoints...');
  const payrunsData = await testGet('Payruns List', '/payruns', (d) => {
    console.log(`     - Payruns count: ${d.length || (d.data && d.data.length)}`);
  });
  const payrunsList = payrunsData?.data || payrunsData || [];
  if (payrunsList[0]?.id) {
    await testGet('Payrun Detail', `/payruns/${payrunsList[0].id}`, (d) => {
      console.log(`     - Payrun status: ${d.status}, payslips count: ${d.payslips?.length || 0}`);
    });
  }

  // 9. Test Salary Structures & Rules
  console.log('\n9. Auditing Salary Structures & Rules endpoints...');
  const structuresData = await testGet('Salary Structures List', '/payroll/structures', (d) => {
    console.log(`     - Structures count: ${d.length || (d.data && d.data.length)}`);
  });
  const structuresList = structuresData?.data || structuresData || [];
  if (structuresList[0]?.id) {
    await testGet('Salary Structure Detail', `/payroll/structures/${structuresList[0].id}`, (d) => {
      console.log(`     - Structure rules count: ${d.rules?.length || 0}`);
    });
  }
  await testGet('Salary Rules List', '/payroll/rules', (d) => {
    console.log(`     - Rules count: ${d.length || (d.data && d.data.length)}`);
  });

  // 10. Test Payslips
  console.log('\n10. Auditing Payslips endpoints...');
  const payslipsData = await testGet('Payslips List', '/payslips', (d) => {
    console.log(`     - Payslips count: ${d.length || (d.data && d.data.length)}`);
  });
  const payslipsList = payslipsData?.data || payslipsData || [];
  if (payslipsList[0]?.id) {
    await testGet('Payslip Detail', `/payslips/${payslipsList[0].id}`, (d) => {
      console.log(`     - Payslip lines count: ${d.lines?.length || 0}`);
    });
  }

  // 11. Test Documents
  console.log('\n11. Auditing Documents endpoints...');
  await testGet('Documents List', '/documents', (d) => {
    console.log(`     - Documents count: ${d.length || (d.data && d.data.length)}`);
  });

  // 12. Test Users Management
  console.log('\n12. Auditing Users endpoints...');
  await testGet('Users List', '/users?page=1&limit=20', (d) => {
    const list = d.data || d.users || d;
    console.log(`     - Users count: ${list.length}`);
  });

  console.log('\n=== COMPLETE ENDPOINT AUDIT COMPLETED ===');
}

runAudit().catch(console.error);
