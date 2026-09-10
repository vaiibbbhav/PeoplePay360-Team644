import { Router } from 'express';
import * as timeoffController from './timeoff.controller';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
  requireEmployeeBodyAccess,
} from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

// User Time Off Meta
router.get('/meta', timeoffController.getTimeOffMeta);

// Employee Leave Balances
router.get(
  '/balances',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  timeoffController.getEmployeeBalances,
);

// Time off types
router.get(
  '/types',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  timeoffController.listTimeOffTypes,
);

router.post('/types', requirePermission('timeoff.write'), timeoffController.createTimeOffType);

// Allocations
router.get(
  '/allocations',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  timeoffController.listAllocations,
);

router.post('/allocations', requirePermission('timeoff.write'), timeoffController.createAllocation);

router.post(
  '/allocations/:id/approve',
  requirePermission('timeoff.approve'),
  timeoffController.approveAllocation,
);

// Leave Requests
router.get(
  '/requests',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  timeoffController.listRequests,
);

router.get(
  '/requests/:id',
  requireAnyPermission(['timeoff.read', 'timeoff.self.read']),
  timeoffController.getRequestById,
);

router.post(
  '/requests',
  requirePermission('timeoff.self.create'),
  requireEmployeeBodyAccess,
  timeoffController.createRequest,
);

// Approve request
router.post('/requests/:id/approve', timeoffController.approveRequest);

// Refuse request
router.post('/requests/:id/refuse', timeoffController.refuseRequest);

export default router;
