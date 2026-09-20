import { findDepartmentsByResponsibleUser } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/auth';

describe('SCEN-637: 責任者ユーザーIDが null の場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('責任者ユーザーIDが null の場合、InvalidUserIdError が発生する', async () => {
    const input = {
      responsibleUserId: null as any,
      statusFilter: undefined,
      requestingUserId: 'valid-user-id',
    };

    try {
      await findDepartmentsByResponsibleUser(input);
      fail('InvalidUserIdError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('InvalidUserIdError');
      expect(error.message).toBe('責任者ユーザーIDは必須です。');
    }
  });
});