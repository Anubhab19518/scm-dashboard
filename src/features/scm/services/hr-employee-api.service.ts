import { apiClient } from '@/lib/api-client';

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  employmentStatus: string;
  joiningDate?: string;
  companyName?: string;
  companyId?: string;
  departmentName?: string;
  departmentId?: string;
  jobRoleName?: string;
  jobRoleId?: string;
  siteName?: string;
}

export interface CompanyOption {
  id: string;
  name: string;
  code?: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string;
  companyId?: string;
}

export interface JobRoleOption {
  id: string;
  name: string;
  code?: string;
  departmentId?: string;
}

export const hrEmployeeApi = {
  // 1. Fetch all employees in current workspace and enrich with active assignments
  async listEmployees(params?: { status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get('/api/v1/hr/employees', { params });
    const rawData = res.data?.data || res.data || [];
    const rawList: Record<string, unknown>[] = Array.isArray(rawData) ? rawData : [];

    // Fetch active assignments in parallel for all employees
    const assignmentResults = await Promise.allSettled(
      rawList.map((emp) =>
        apiClient
          .get(`/api/v1/hr/employees/${emp['id']}/active-assignment`)
          .then((r) => r.data?.data || r.data),
      ),
    );

    const enrichedList: EmployeeSummary[] = rawList.map((emp, idx) => {
      const assignmentRes = assignmentResults[idx];
      const assignment =
        assignmentRes && assignmentRes.status === 'fulfilled'
          ? (assignmentRes.value as Record<string, unknown>)
          : null;

      const assignmentCompany = assignment?.company as Record<string, unknown> | undefined;
      const empCompany = emp.company as Record<string, unknown> | undefined;
      const assignmentDept = assignment?.department as Record<string, unknown> | undefined;
      const empDept = emp.department as Record<string, unknown> | undefined;
      const assignmentJobRole = assignment?.jobRole as Record<string, unknown> | undefined;
      const empJobRole = emp.jobRole as Record<string, unknown> | undefined;
      const assignmentSite = assignment?.site as Record<string, unknown> | undefined;
      const empSite = emp.site as Record<string, unknown> | undefined;

      const companyName =
        (assignmentCompany?.name as string) ??
        (empCompany?.name as string) ??
        (emp.companyName as string) ??
        'Unassigned';
      const companyId =
        (assignment?.companyId as string) ??
        (emp.companyId as string) ??
        (assignmentCompany?.id as string);

      const departmentName =
        (assignmentDept?.name as string) ??
        (empDept?.name as string) ??
        (emp.departmentName as string) ??
        '—';
      const departmentId =
        (assignment?.departmentId as string) ??
        (emp.departmentId as string) ??
        (assignmentDept?.id as string);

      const jobRoleName =
        (assignmentJobRole?.name as string) ??
        (empJobRole?.name as string) ??
        (emp.jobRoleName as string) ??
        '—';
      const jobRoleId =
        (assignment?.jobRoleId as string) ??
        (emp.jobRoleId as string) ??
        (assignmentJobRole?.id as string);

      const siteName =
        (assignmentSite?.name as string) ??
        (empSite?.name as string) ??
        (emp.siteName as string) ??
        '';

      return {
        id: String(emp['id'] || ''),
        employeeCode: String(emp['employeeCode'] || ''),
        firstName: String(emp['firstName'] || ''),
        lastName: String(emp['lastName'] || ''),
        fullName:
          [emp['firstName'], emp['lastName']].filter(Boolean).map(String).join(' ') ||
          String(emp['employeeCode'] || 'Employee'),
        email: emp['email'] ? String(emp['email']) : '',
        phone: emp['phone'] ? String(emp['phone']) : '',
        employmentStatus: String(emp['employmentStatus'] || emp['status'] || 'ACTIVE'),
        joiningDate: emp['joiningDate'] ? String(emp['joiningDate']) : undefined,
        companyName,
        companyId,
        departmentName,
        departmentId,
        jobRoleName,
        jobRoleId,
        siteName,
      };
    });

    return {
      employees: enrichedList,
      meta: res.data?.meta,
    };
  },

  // 2. Fetch employee active assignment (Company, Department, Role, Site)
  async getActiveAssignment(employeeId: string) {
    try {
      const res = await apiClient.get(`/api/v1/hr/employees/${employeeId}/active-assignment`);
      return res.data?.data || res.data;
    } catch {
      return null;
    }
  },

  // 3. Fetch Master Dropdowns for filters
  async getCompanies(): Promise<CompanyOption[]> {
    try {
      const res = await apiClient.get('/api/v1/hr/companies');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getDepartments(): Promise<DepartmentOption[]> {
    try {
      const res = await apiClient.get('/api/v1/hr/departments');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getJobRoles(): Promise<JobRoleOption[]> {
    try {
      const res = await apiClient.get('/api/v1/hr/job-roles');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // 4. Dispatch / Allocate Set to Employee(s)
  async allocateSet(payload: {
    employeeIds: string[];
    setId: string;
    setQuantity?: number;
    notes?: string;
  }) {
    const res = await apiClient.post('/api/v1/scm/allocations', {
      employeeIds: payload.employeeIds,
      setId: payload.setId,
      setQuantity: payload.setQuantity ?? 1,
      notes: payload.notes,
    });
    return res.data?.data || res.data;
  },
};
