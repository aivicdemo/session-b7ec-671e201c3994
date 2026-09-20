import { findDepartmentsByResponsibleUser } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
  authorizeUserAction: jest.fn(),
}));

describe('SCEN-636: 責任者ユーザーIDが空文字列の場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue(undefined);
  });

  it('責任者ユーザーIDが空文字列の場合、InvalidUserIdErrorが発生する', async () => {
    const emptyResponsibleUserId = '';
    const requestingUserId = 'valid-admin-user-id';

    await expect(
      findDepartmentsByResponsibleUser({
        responsibleUserId: emptyResponsibleUserId,
        statusFilter: undefined,
        requestingUserId: requestingUserId,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidUserIdError',
        message: '責任者ユーザーIDは必須です。',
      })
    );
  });
});