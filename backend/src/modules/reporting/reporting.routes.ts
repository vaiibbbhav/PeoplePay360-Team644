import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as reportingService from './reporting.service';

const router = Router();

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const dashboardData = await reportingService.getDashboardOverview();
    res.json(dashboardData);
  }),
);

export default router;
