import * as contractsRepo from './contracts.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';

export async function listContracts(employeeId?: string) {
  return await contractsRepo.findAllContracts(employeeId);
}

export async function getContractById(id: string) {
  const contract = await contractsRepo.findContractById(id);
  if (!contract) {
    throw new NotFoundError(`Contract with ID ${id} not found`);
  }
  return contract;
}

export async function getActiveContractForPeriod(employeeId: string, periodStart: string, periodEnd: string) {
  return await contractsRepo.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
}

export async function createContract(data: Record<string, unknown>) {
  if (data.status === 'active') {
    const overlapping = await contractsRepo.findOverlappingActiveContracts(
      data.employeeId as string,
      data.startDate as string,
      (data.endDate as string) || null
    );
    if (overlapping.length > 0) {
      throw new ConflictError('An active contract already exists for this employee in the specified period');
    }
  }

  if (data.endDate && (data.endDate as string) < (data.startDate as string)) {
    throw new ValidationError('End date cannot be prior to start date');
  }

  return await contractsRepo.insertContract(data);
}

export async function updateContract(id: string, data: Record<string, unknown>) {
  const existing = await getContractById(id);

  const newStatus = (data.status as string) || existing.status;
  const newStart = (data.startDate as string) || existing.start_date;
  const newEnd = data.endDate !== undefined ? (data.endDate as string | null) : existing.end_date;

  if (newStatus === 'active') {
    const overlapping = await contractsRepo.findOverlappingActiveContracts(
      existing.employee_id,
      newStart,
      newEnd,
      id
    );
    if (overlapping.length > 0) {
      throw new ConflictError('An active contract already exists for this employee in the specified period');
    }
  }

  return await contractsRepo.updateContract(id, data);
}
