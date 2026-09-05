import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as reportingService from './reporting.service';
import { authenticateToken, requirePermission } from '../../shared/auth-middleware';

const router = Router();
router.use(authenticateToken);

router.get(
  '/dashboard',
  requirePermission('reporting.read'),
  asyncHandler(async (_req, res) => {
    const dashboardData = await reportingService.getDashboardOverview();
    res.json(dashboardData);
  }),
);

export default router;
