                              ┌──────────────────────┐
                              │       USERS          │
                              │  Auth + RBAC + Roles │
                              └──────────┬───────────┘
                                         │
                                         │ employeeId
                                         ▼

┌──────────────────────┐ ┌──────────────────────┐
│ ORGANIZATION │ │ EMPLOYEES │
│ │ │ ★ Central Hub ★ │
│ • departments │──────▶│ │
│ • jobPositions │ │ Personal Information │
└──────────────────────┘ │ Organization │
│ Employment Status │
┌──────────────────────┐ │ Payroll Information │
│ WORK SCHEDULES │──────▶│ │
│ │ └───────┬──────────────┘
│ • schedules │ │
│ • schedule lines │ │
└──────────────────────┘ │
│
┌─────────────┼─────────────┐
│ │ │
▼ ▼ ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│ CONTRACTS │ │ ATTENDANCE │ │ TIME OFF │
│ │ │ │ │ │
│ • wage │ │ • check-in │ │ • requests │
│ • wage type │ │ • check-out │ │ • allocations│
│ • dates │ │ • hours │ │ • types │
│ • status │ │ • status │ │ • balances │
└──────┬──────┘ └─────────────┘ └───────┬──────┘
│ │
│ │
▼ ▼
┌──────────────────┐ ┌──────────────────┐
│ SALARY STRUCTURE │ │ LEAVE BALANCE │
│ │ │ VALIDATION │
│ • structure │ └────────┬─────────┘
│ • salary rules │ │
└────────┬─────────┘ │
│ │
└──────────────┬──────────────┘
│
▼
┌─────────────────────┐
│ PAYRUN │
│ │
│ Period │
│ Salary Structure │
│ Selected Employees │
│ Status │
│ Warnings │
└──────────┬──────────┘
│
│ generates
▼
┌─────────────────────┐
│ PAYSLIPS │
│ │
│ Employee │
│ Contract │
│ Worked Days │
│ Basic / Gross │
│ Deductions / Net │
└──────────┬──────────┘
│
│ breakdown
▼
┌─────────────────────┐
│ PAYSLIP LINES │
│ │
│ Rule Code │
│ Category │
│ Sequence │
│ Computed Amount │
└─────────────────────┘
