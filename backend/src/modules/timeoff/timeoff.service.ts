import * as timeoffRepo from './timeoff.repository';
import { NotFoundError, ValidationError } from '../../shared/errors';

export async function listTimeOffTypes() {
  return await timeoffRepo.findAllTimeOffTypes();
}

export async function createTimeOffType(data: Record<string, unknown>) {
  return await timeoffRepo.insertTimeOffType(data);
}

export async function listAllocations(employeeId?: string) {
  return await timeoffRepo.findAllAllocations(employeeId);
}

export async function createAllocation(data: Record<string, unknown>) {
  if ((data.validTo as string) < (data.validFrom as string)) {
    throw new ValidationError('Validity end date cannot be earlier than start date');
  }
  return await timeoffRepo.insertAllocation(data);
}

export async function approveAllocation(id: string, approverId?: string) {
  const allocation = await timeoffRepo.findAllocationById(id);
  if (!allocation) {
    throw new NotFoundError(`Allocation ${id} not found`);
  }
  return await timeoffRepo.approveAllocation(id, approverId);
}

export async function listRequests(employeeId?: string) {
  return await timeoffRepo.findAllRequests(employeeId);
}

export async function getRequestById(id: string) {
  const req = await timeoffRepo.findRequestById(id);
  if (!req) {
    throw new NotFoundError(`Time off request ${id} not found`);
  }
  return req;
}

export async function createRequest(data: Record<string, unknown>) {
  const type = await timeoffRepo.findTimeOffTypeById(data.timeOffTypeId as string);
  if (!type) {
    throw new NotFoundError('Invalid time off type');
  }

  const duration = Number(data.duration);
  if (type.requiresAllocation) {
    const allocation = await timeoffRepo.findValidAllocation(
      data.employeeId as string,
      type.id,
      data.startDate as string,
    );
    if (!allocation) {
      throw new ValidationError('No active approved allocation found for this period');
    }
    const remaining = parseFloat(allocation.remainingAmount);
    if (remaining < duration) {
      throw new ValidationError(
        `Insufficient leave balance. Remaining: ${remaining}, Requested: ${duration}`,
      );
    }
  }

  return await timeoffRepo.insertRequest(data);
}

export async function approveRequest(id: string, approverId?: string) {
  const request = await getRequestById(id);
  if (request.status !== 'pending') {
    throw new ValidationError(`Cannot approve request with status '${request.status}'`);
  }

  const type = await timeoffRepo.findTimeOffTypeById(request.time_off_type_id);
  let allocationId: string | null = null;
  const duration = parseFloat(request.duration);

  if (type?.requiresAllocation) {
    const allocation = await timeoffRepo.findValidAllocation(
      request.employee_id,
      request.time_off_type_id,
      request.start_date,
    );
    if (!allocation) {
      throw new ValidationError('No valid approved allocation available to deduct from');
    }
    const remaining = parseFloat(allocation.remainingAmount);
    if (remaining < duration) {
      throw new ValidationError(`Insufficient allocation remaining (${remaining} < ${duration})`);
    }
    allocationId = allocation.id;
  }

  return await timeoffRepo.executeApproveRequestTx(id, allocationId, duration, approverId);
}

export async function refuseRequest(id: string, reason?: string) {
  const request = await getRequestById(id);
  if (request.status !== 'pending') {
    throw new ValidationError(`Cannot refuse request with status '${request.status}'`);
  }
  return await timeoffRepo.refuseRequest(id, reason);
}
