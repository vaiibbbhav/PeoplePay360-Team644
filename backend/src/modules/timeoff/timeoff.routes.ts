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
  assertCanViewTimeOffRequest,
  assertCanApproveTimeOffRequest,
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
    assertCanViewTimeOffRequest(req, request);
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
    const request = await timeoffService.getRequestById(req.params.id);
    assertCanApproveTimeOffRequest(req, request);
    const approved = await timeoffService.approveRequest(req.params.id, req.user?.id);
    res.json(approved);
  }),
);

// Refuse request: authorized for HR/Admin OR the direct manager of the employee
router.post(
  '/requests/:id/refuse',
  asyncHandler(async (req, res) => {
    const request = await timeoffService.getRequestById(req.params.id);
    assertCanApproveTimeOffRequest(req, request);
    const reason = req.body.reason as string | undefined;
    const refused = await timeoffService.refuseRequest(req.params.id, reason, req.user?.id);
    res.json(refused);
  }),
);

export default router;
