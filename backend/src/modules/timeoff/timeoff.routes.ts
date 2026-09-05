import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateTimeOffType,
  validateCreateAllocation,
  validateCreateRequest,
} from './timeoff.validators';
import * as timeoffService from './timeoff.service';

const router = Router();

// Time off types
router.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const types = await timeoffService.listTimeOffTypes();
    res.json(types);
  }),
);

router.post(
  '/types',
  asyncHandler(async (req, res) => {
    const validated = validateCreateTimeOffType(req.body);
    const created = await timeoffService.createTimeOffType(validated);
    res.status(201).json(created);
  }),
);

// Allocations
router.get(
  '/allocations',
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId as string | undefined;
    const allocations = await timeoffService.listAllocations(employeeId);
    res.json(allocations);
  }),
);

router.post(
  '/allocations',
  asyncHandler(async (req, res) => {
    const validated = validateCreateAllocation(req.body);
    const created = await timeoffService.createAllocation(validated);
    res.status(201).json(created);
  }),
);

router.post(
  '/allocations/:id/approve',
  asyncHandler(async (req, res) => {
    const approverId = req.user?.id;
    const approved = await timeoffService.approveAllocation(req.params.id, approverId);
    res.json(approved);
  }),
);

// Leave Requests
router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId as string | undefined;
    const requests = await timeoffService.listRequests(employeeId);
    res.json(requests);
  }),
);

router.get(
  '/requests/:id',
  asyncHandler(async (req, res) => {
    const request = await timeoffService.getRequestById(req.params.id);
    res.json(request);
  }),
);

router.post(
  '/requests',
  asyncHandler(async (req, res) => {
    const validated = validateCreateRequest(req.body);
    const created = await timeoffService.createRequest(validated);
    res.status(201).json(created);
  }),
);

router.post(
  '/requests/:id/approve',
  asyncHandler(async (req, res) => {
    const approverId = req.user?.id;
    const approved = await timeoffService.approveRequest(req.params.id, approverId);
    res.json(approved);
  }),
);

router.post(
  '/requests/:id/refuse',
  asyncHandler(async (req, res) => {
    const reason = req.body.reason as string | undefined;
    const refused = await timeoffService.refuseRequest(req.params.id, reason);
    res.json(refused);
  }),
);

export default router;
