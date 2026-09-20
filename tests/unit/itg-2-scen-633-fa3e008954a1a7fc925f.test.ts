import { findDepartmentsByResponsibleUser } from '../../src/logic/persistence-layer';

describe('SCEN-633: findDepartmentsByResponsibleUser', () => {
  it('should return only departments with specified status when statusFilter is provided', async () => {
    const requestingUserId = 'admin-user-001';
    const responsibleUserId = 'user-leader-001';
    const statusFilter = 'active';

    const result = await findDepartmentsByResponsibleUser({
      responsibleUserId,
      statusFilter,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.departments).toBeDefined();
    expect(Array.isArray(result.departments)).toBe(true);

    result.departments.forEach((department) => {
      expect(department.status).toBe('active');
      expect(department.responsibleUserId).toBe(responsibleUserId);
    });

    expect(result.totalCount).toBe(result.departments.length);
  });
});