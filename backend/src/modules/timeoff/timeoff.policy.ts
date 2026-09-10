import { Request } from 'express';
import { assertOwnerOrPermission, assertManagerOrPermission } from '../../shared/auth-middleware';

type TimeOffRequestAuthContext = {
  employee_id: string;
  manager_id?: string | null;
};

/**
 * Validates that the requesting user is allowed to view a time-off request.
 * Allowed if:
 * 1. The user has the 'timeoff.read' RBAC permission (HR Manager, Admin, etc.)
 * 2. The user is the owner (the employee who submitted the request)
 * 3. The user is the direct manager of the employee
 */
export function assertCanViewTimeOffRequest(
  req: Request,
  request: TimeOffRequestAuthContext,
): void {
  // If user is direct reporting manager, they can view
  if (
    req.user?.role === 'Employee' &&
    req.user.employeeId &&
    request.manager_id === req.user.employeeId
  ) {
    return;
  }

  // Otherwise, fallback to owner check or 'timeoff.read' permission
  assertOwnerOrPermission(
    req,
    request.employee_id,
    'timeoff.read',
    'You are not authorized to view this request',
  );
}

/**
 * Validates that the requesting user is allowed to approve or refuse a time-off request.
 * Allowed if:
 * 1. The user has the 'timeoff.approve' RBAC permission (HR Manager, Admin, etc.)
 * 2. The user is the direct manager of the requesting employee.
 * Note: An employee CANNOT approve their own request.
 */
export function assertCanApproveTimeOffRequest(
  req: Request,
  request: { manager_id?: string | null },
): void {
  assertManagerOrPermission(
    req,
    request.manager_id,
    'timeoff.approve',
    'Only HR administrators or the direct reporting manager can approve or refuse this request',
  );
}
