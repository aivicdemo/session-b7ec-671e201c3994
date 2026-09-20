import { findDepartmentsByResponsibleUser, FindDepartmentsByResponsibleUserInput } from '../../src/logic/persistence-layer';

describe('SCEN-641: 責任者ユーザーIDで部門検索し、出力に反映させる', () => {
  test('指定された責任者ユーザーIDが出力の responsibleUserId に反映される', async () => {
    const responsibleUserId = 'user-resp-001';
    const requestingUserId = 'user-admin-001';

    const input: FindDepartmentsByResponsibleUserInput = {
      responsibleUserId,
      statusFilter: undefined,
      requestingUserId,
    };

    const result = await findDepartmentsByResponsibleUser(input);

    expect(result).toBeDefined();
    expect(result.responsibleUserId).toBe(responsibleUserId);
    expect(typeof result.found).toBe('boolean');
    expect(typeof result.totalCount).toBe('number');
    expect(result.departments).toBeDefined();
    expect(Array.isArray(result.departments)).toBe(true);

    if (result.found) {
      expect(result.departments.length).toBeGreaterThan(0);
      expect(result.totalCount).toBe(result.departments.length);
    } else {
      expect(result.totalCount).toBe(0);
    }
  });
});