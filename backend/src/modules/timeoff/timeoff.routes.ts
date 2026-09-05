import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateTimeOffType,
  validateCreateAllocation,
  validateCreateRequest,
} from './timeoff.validators';
import * as timeoffService from './timeoff.service';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
  requireEmployeeBodyAccess,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

// User Time Off Meta (e.g. check if user has direct reports)
router.get(
  '/meta',
  asyncHandler(async (req, res) => {
    const isManager = await timeoffService.hasDirectReports(req.user?.employeeId);
    res.json({
      isManager,
      employeeId: req.user?.employeeId || null,
      role: req.user?.role || 'Employee',
    });
  }),
);

// Employee Leave Balances
router.get(
  '/balances',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (req, res) => {
    const employeeId =
      req.user?.role === 'Employee'
        ? req.user.employeeId
        : (req.query.employeeId as string) || req.user?.employeeId;

    if (!employeeId) {
      res.json([]);
      return;
    }

    const balances = await timeoffService.getEmployeeBalances(employeeId);
    res.json(balances);
  }),
);

// Time off types
router.get(
  '/types',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (_req, res) => {
    const types = await timeoffService.listTimeOffTypes();
    res.json(types);
  }),
);

router.post(
  '/types',
  requirePermission('timeoff.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateTimeOffType(req.body);
    const created = await timeoffService.createTimeOffType(validated);
    res.status(201).json(created);
  }),
);

// Allocations
router.get(
  '/allocations',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (req, res) => {
    const employeeId =
      req.user?.role === 'Employee'
        ? req.user.employeeId
        : (req.query.employeeId as string | undefined);
    const allocations = await timeoffService.listAllocations(employeeId);
    res.json(allocations);
  }),
);

router.post(
  '/allocations',
  requirePermission('timeoff.write'),
  asyncHandler(async (req, res) => {
    const validated = validateCreateAllocation(req.body);
    const created = await timeoffService.createAllocation(validated);
    res.status(201).json(created);
  }),
);

router.post(
  '/allocations/:id/approve',
  requirePermission('timeoff.approve'),
  asyncHandler(async (req, res) => {
    const approverId = req.user?.id;
    const approved = await timeoffService.approveAllocation(req.params.id, approverId);
    res.json(approved);
  }),
);

// Leave Requests
router.get(
  '/requests',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (req, res) => {
    const scope = req.query.scope as string | undefined;
    const status = req.query.status as string | undefined;

    // Team scope: manager reviewing direct reports
    if (scope === 'team') {
      const managerId = req.user?.employeeId;
      if (!managerId) {
        res.json([]);
        return;
      }
      const requests = await timeoffService.listRequests({
        managerId,
        status,
      });
      res.json(requests);
      return;
    }

    // Employee role: defaults to self requests
    if (req.user?.role === 'Employee') {
      const requests = await timeoffService.listRequests({
        employeeId: req.user.employeeId,
        status,
      });
      res.json(requests);
      return;
    }

    // HR / Admin role: can filter by employeeId or query all
    const employeeId = req.query.employeeId as string | undefined;
    const requests = await timeoffService.listRequests({
      employeeId,
      status,
    });
    res.json(requests);
  }),
);

router.get(
  '/requests/:id',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (req, res) => {
    const request = await timeoffService.getRequestById(req.params.id);
    // HR/Admin, owner, or direct manager can view
    const isHrOrAdmin = [
      'Admin',
      'HR Manager',
      'HR Payroll Manager',
      'HR Payroll User',
    ].includes(req.user?.role || '');

    if (!isHrOrAdmin && req.user?.employeeId !== request.employee_id) {
      if (req.user?.employeeId !== request.manager_id) {
        res.status(403).json({ error: 'You are not authorized to view this request' });
        return;
      }
    }
    res.json(request);
  }),
);

router.post(
  '/requests',
  requirePermission('timeoff.self.create'),
  requireEmployeeBodyAccess,
  asyncHandler(async (req, res) => {
    const validated = validateCreateRequest(req.body);
    const created = await timeoffService.createRequest(validated);
    res.status(201).json(created);
  }),
);

// Approve request: authorized for HR/Admin OR the direct manager of the employee
router.post(
  '/requests/:id/approve',
  asyncHandler(async (req, res) => {
    const user = req.user ? { id: req.user.id, role: req.user.role, employeeId: req.user.employeeId } : undefined;
    const approved = await timeoffService.approveRequest(req.params.id, user);
    res.json(approved);
  }),
);

// Refuse request: authorized for HR/Admin OR the direct manager of the employee
router.post(
  '/requests/:id/refuse',
  asyncHandler(async (req, res) => {
    const reason = req.body.reason as string | undefined;
    const user = req.user ? { id: req.user.id, role: req.user.role, employeeId: req.user.employeeId } : undefined;
    const refused = await timeoffService.refuseRequest(req.params.id, reason, user);
    res.json(refused);
  }),
);

export default router;
