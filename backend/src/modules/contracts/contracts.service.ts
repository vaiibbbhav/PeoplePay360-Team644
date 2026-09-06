import * as contractsRepo from './contracts.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';
import { CreateContractInput, UpdateContractInput } from './contracts.validators';

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

export async function getActiveContractForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
) {
  return await contractsRepo.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
}

export async function getActiveContractsForEmployees(
  employeeIds: string[],
  periodStart: string,
  periodEnd: string,
) {
  return await contractsRepo.findActiveContractsForEmployees(employeeIds, periodStart, periodEnd);
}

export async function createContract(data: CreateContractInput) {
  if (data.status === 'active') {
    const overlapping = await contractsRepo.findOverlappingActiveContracts(
      data.employeeId,
      data.startDate,
      data.endDate || null,
    );
    if (overlapping.length > 0) {
      throw new ConflictError(
        'An active contract already exists for this employee in the specified period',
      );
    }
  }

  if (data.endDate && data.endDate < data.startDate) {
    throw new ValidationError('End date cannot be prior to start date');
  }

  return await contractsRepo.insertContract(data);
}

export async function updateContract(id: string, data: UpdateContractInput) {
  const existing = await getContractById(id);

  const newStatus = data.status || existing.status;
  const newStart = data.startDate || existing.start_date;
  const newEnd = data.endDate !== undefined ? data.endDate : existing.end_date;

  if (newStatus === 'active') {
    const overlapping = await contractsRepo.findOverlappingActiveContracts(
      existing.employee_id,
      newStart,
      newEnd,
      id,
    );
    if (overlapping.length > 0) {
      throw new ConflictError(
        'An active contract already exists for this employee in the specified period',
      );
    }
  }

  if (newEnd && newEnd < newStart) {
    throw new ValidationError('End date cannot be prior to start date');
  }

  return await contractsRepo.updateContract(id, data);
}

export async function getContractsMetadata() {
  return await contractsRepo.getContractsMetadata();
}
