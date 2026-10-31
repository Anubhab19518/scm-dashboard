import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hrEmployeeApi } from '../hr-employee-api.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('HREmployeeApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list and enrich employees with active assignment data', async () => {
    const mockedGet = vi.mocked(apiClient.get);

    mockedGet.mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/hr/employees/emp-1/active-assignment')) {
        return {
          data: {
            data: {
              company: { id: 'comp-1', name: 'Apex Logistics' },
              department: { id: 'dept-1', name: 'Field Ops' },
              jobRole: { id: 'role-1', name: 'Driver' },
              site: { name: 'Terminal A' },
            },
          },
        } as never;
      }

      if (url.includes('/api/v1/hr/employees')) {
        return {
          data: {
            data: [
              {
                id: 'emp-1',
                employeeCode: 'EMP001',
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'alice@apex.com',
                employmentStatus: 'ACTIVE',
              },
            ],
            meta: { total: 1 },
          },
        } as never;
      }

      return { data: {} } as never;
    });

    const res = await hrEmployeeApi.listEmployees();
    expect(res.employees).toHaveLength(1);
    expect(res.employees[0]?.companyName).toBe('Apex Logistics');
    expect(res.employees[0]?.departmentName).toBe('Field Ops');
    expect(res.employees[0]?.jobRoleName).toBe('Driver');
    expect(res.employees[0]?.siteName).toBe('Terminal A');
  });

  it('should fetch dropdown options for companies, departments, and job roles', async () => {
    const mockedGet = vi.mocked(apiClient.get);

    mockedGet
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 'c-1', name: 'Holding Corp', code: 'HC' }],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 'd-1', name: 'Engineering', code: 'ENG' }],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 'jr-1', name: 'Technician', code: 'TECH' }],
        },
      } as never);

    const companies = await hrEmployeeApi.getCompanies();
    expect(companies).toHaveLength(1);
    expect(companies[0]?.name).toBe('Holding Corp');

    const departments = await hrEmployeeApi.getDepartments();
    expect(departments).toHaveLength(1);
    expect(departments[0]?.name).toBe('Engineering');

    const jobRoles = await hrEmployeeApi.getJobRoles();
    expect(jobRoles).toHaveLength(1);
    expect(jobRoles[0]?.name).toBe('Technician');
  });

  it('should getActiveAssignment for employee and handle errors gracefully', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet
      .mockResolvedValueOnce({
        data: { data: { company: { name: 'HQ' } } },
      } as never)
      .mockRejectedValueOnce(new Error('Network error'));

    const assignment = await hrEmployeeApi.getActiveAssignment('emp-1');
    expect(assignment.company.name).toBe('HQ');

    const fallback = await hrEmployeeApi.getActiveAssignment('emp-2');
    expect(fallback).toBeNull();
  });

  it('should allocate set to employees via POST', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValueOnce({
      data: { success: true, count: 2 },
    } as never);

    const res = await hrEmployeeApi.allocateSet({
      employeeIds: ['emp-1', 'emp-2'],
      setId: 'set-ppe-01',
      setQuantity: 1,
      notes: 'Induction bundle',
    });

    expect(res.success).toBe(true);
  });
});
