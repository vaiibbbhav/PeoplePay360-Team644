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
  assertEmployeeAccess,
  requireAnyPermission,
  requirePermission,
  requireEmployeeBodyAccess,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

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
    const employeeId =
      req.user?.role === 'Employee'
        ? req.user.employeeId
        : (req.query.employeeId as string | undefined);
    const requests = await timeoffService.listRequests(employeeId);
    res.json(requests);
  }),
);

router.get(
  '/requests/:id',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  asyncHandler(async (req, res) => {
    const request = await timeoffService.getRequestById(req.params.id);
    assertEmployeeAccess(req, request.employee_id);
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

router.post(
  '/requests/:id/approve',
  requirePermission('timeoff.approve'),
  asyncHandler(async (req, res) => {
    const approverId = req.user?.id;
    const approved = await timeoffService.approveRequest(req.params.id, approverId);
    res.json(approved);
  }),
);

router.post(
  '/requests/:id/refuse',
  requirePermission('timeoff.approve'),
  asyncHandler(async (req, res) => {
    const reason = req.body.reason as string | undefined;
    const refused = await timeoffService.refuseRequest(req.params.id, reason);
    res.json(refused);
  }),
);

export default router;
