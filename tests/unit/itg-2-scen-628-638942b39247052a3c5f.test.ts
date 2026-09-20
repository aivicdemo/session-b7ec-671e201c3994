import { findDepartmentById } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-628: 指定された部門IDが存在しないとき、DepartmentNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DepartmentNotFoundError when department ID does not exist', async () => {
    const input = {
      departmentId: 'DEPT-999999',
      requestingUserId: 'USER-001',
    };

    await expect(findDepartmentById(input)).rejects.toMatchObject({
      name: 'DepartmentNotFoundError',
      message: 'Department with ID DEPT-999999 not found.',
    });
  });
});