import * as reportingRepo from './reporting.repository';

export async function getDashboardOverview() {
  const [payrollKpis, timeOffStats, attendanceHealth, deptCosts, salaryTrends, contractAndSchedule] =
    await Promise.all([
      reportingRepo.getPayrollKpis(),
      reportingRepo.getTimeOffStats(),
      reportingRepo.getAttendanceHealthStats(),
      reportingRepo.getSalaryCostByDepartment(),
      reportingRepo.getMonthlySalaryTrends(),
      reportingRepo.getContractAndScheduleStats(),
    ]);

  const totalAttendance = attendanceHealth.total_attendance_entries || 0;
  const presentRate =
    totalAttendance > 0
      ? Math.round(
          ((attendanceHealth.present_count + attendanceHealth.overtime_count) / totalAttendance) *
            100,
        )
      : 100;

  return {
    kpis: {
      totalNetPaid: Number(payrollKpis.total_net_paid),
      payslipsGenerated: Number(payrollKpis.payslips_generated),
      averageSalary: Number(payrollKpis.average_salary),
      approvedTimeOffDays: Number(timeOffStats.approved_days),
      pendingTimeOffRequests: Number(timeOffStats.pending_requests),
      attendanceHealthScore: `${presentRate}%`,
    },
    attendance: {
      present: attendanceHealth.present_count,
      late: attendanceHealth.late_count,
      absent: attendanceHealth.absent_count,
      overtime: attendanceHealth.overtime_count,
      manualEdits: attendanceHealth.manual_edits_count,
    },
    contracts: contractAndSchedule.contracts,
    schedules: contractAndSchedule.schedules,
    charts: {
      departmentBreakdown: deptCosts.map((d) => ({
        department: d.department_name,
        headcount: d.employee_count,
        totalCost: parseFloat(d.total_salary_cost),
      })),
      monthlyTrends: salaryTrends.map((m) => ({
        month: m.month_label,
        netSalary: parseFloat(m.total_net),
        grossSalary: parseFloat(m.total_gross),
      })),
    },
  };
}

export async function getAdminOverview() {
  const [attention, access, anomalies, recentActivity] = await Promise.all([
    reportingRepo.getAdminAttentionMetrics(),
    reportingRepo.getAdminAccessSnapshot(),
    reportingRepo.getCrossModuleAnomalies(),
    reportingRepo.getRecentAdminActivity(15),
  ]);

  return {
    attention,
    access,
    anomalies,
    recentActivity,
  };
}

