import React, { useState } from 'react';
import type {
  EmployeeHubDetails,
  EmployeeMetaOptions,
  CreateEmployeeInput,
  EmploymentStatus,
} from '../queries/useEmployees';

type EmployeeFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeHubDetails | null;
  meta: EmployeeMetaOptions;
  onSave: (data: CreateEmployeeInput) => Promise<void>;
  isSaving: boolean;
};

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employee,
  meta,
  onSave,
  isSaving,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'personal' | 'employment'>('personal');

  // Form states
  const [firstName, setFirstName] = useState(employee?.first_name || '');
  const [lastName, setLastName] = useState(employee?.last_name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    employee?.date_of_birth ? employee.date_of_birth.slice(0, 10) : '',
  );
  const [gender, setGender] = useState(employee?.gender || '');
  const [identificationNumber, setIdentificationNumber] = useState(
    employee?.identification_number || '',
  );

  // Bank fields
  const [bankName, setBankName] = useState(employee?.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(employee?.bank_account_number || '');
  const [bankRoutingCode, setBankRoutingCode] = useState(employee?.bank_routing_code || '');

  // Employment fields
  const [departmentId, setDepartmentId] = useState(employee?.department_id || '');
  const [jobPositionId, setJobPositionId] = useState(employee?.job_position_id || '');
  const [managerId, setManagerId] = useState(employee?.manager_id || '');
  const [workingScheduleId, setWorkingScheduleId] = useState(employee?.working_schedule_id || '');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(
    employee?.employment_status || 'active',
  );
  const [dateOfJoining, setDateOfJoining] = useState(
    employee?.date_of_joining
      ? employee.date_of_joining.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('First Name, Last Name, and Work Email are required.');
      return;
    }

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        identificationNumber: identificationNumber.trim() || null,
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankRoutingCode: bankRoutingCode.trim() || null,
        departmentId: departmentId || null,
        jobPositionId: jobPositionId || null,
        managerId: managerId || null,
        workingScheduleId: workingScheduleId || null,
        employmentStatus,
        dateOfJoining,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save employee profile');
    }
  };

  const filteredPositions = departmentId
    ? meta.jobPositions.filter((p) => p.departmentId === departmentId || !p.departmentId)
    : meta.jobPositions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-bg border border-line rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-bg-raised">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">
              {employee ? 'Edit Employee Details' : 'Onboard New Employee'}
            </h2>
            <p className="text-xs text-ink-soft">
              Fill personal identity, bank details, and organizational placement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-line bg-bg text-ink hover:bg-bg-raised transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher within modal */}
        <div className="px-6 pt-3 border-b border-line flex gap-4 bg-bg">
          <button
            type="button"
            onClick={() => setActiveSubTab('personal')}
            className={`pb-2 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'personal'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            1. Personal & Banking
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('employment')}
            className={`pb-2 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeSubTab === 'employment'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            2. Employment & Schedule
          </button>
        </div>

        {/* Error notification banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-line bg-bg-raised text-over-red text-xs">
            {formError}
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSubTab === 'personal' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    First Name <span className="text-over-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Vinayak"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Last Name <span className="text-over-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Mohanty"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Work Email <span className="text-over-red">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vinayak@company.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Tax ID / SSN / National ID
                  </label>
                  <input
                    type="text"
                    value={identificationNumber}
                    onChange={(e) => setIdentificationNumber(e.target.value)}
                    placeholder="GOV-ID-12345"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-line">
                <h4 className="text-xs font-bold text-ink mb-3 uppercase tracking-wider">
                  Payroll Banking Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Chase / HDFC"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-soft mb-1">
                      Routing / IFSC / Swift
                    </label>
                    <input
                      type="text"
                      value={bankRoutingCode}
                      onChange={(e) => setBankRoutingCode(e.target.value)}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'employment' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">No Department Assigned</option>
                    {meta.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Designation / Job Position
                  </label>
                  <select
                    value={jobPositionId}
                    onChange={(e) => setJobPositionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">No Position Assigned</option>
                    {filteredPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">No Reporting Manager (Executive)</option>
                    {meta.managers
                      .filter((m) => m.id !== employee?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Working Schedule Policy
                  </label>
                  <select
                    value={workingScheduleId}
                    onChange={(e) => setWorkingScheduleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">Default Standard (40h/week)</option>
                    {meta.workingSchedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.weeklyHours}h)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Employment Status
                  </label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-bg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-line flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {activeSubTab === 'personal' ? (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('employment')}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-bg-raised border border-line text-ink hover:border-ink-soft transition-colors cursor-pointer"
                >
                  Next: Employment Details →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('personal')}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-bg-raised border border-line text-ink hover:border-ink-soft transition-colors cursor-pointer"
                >
                  ← Back: Personal Details
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Profile...' : employee ? 'Update Profile' : 'Create Employee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
