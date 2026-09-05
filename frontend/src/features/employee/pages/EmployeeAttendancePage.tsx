import React from 'react';
import { EmployeeLayout } from '../components/EmployeeLayout';

export const EmployeeAttendancePage: React.FC = () => {
  return (
    <EmployeeLayout title="Attendance">
      <div className="py-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Hey, this is attendance page
        </h1>
      </div>
    </EmployeeLayout>
  );
};

export const AttendancePage = EmployeeAttendancePage;
export default EmployeeAttendancePage;
