import { findUsersByRole } from '../../src/logic/persistence-layer';

describe('SCEN-423: 定義されていない役割を指定すると、役割が無効である旨のエラーが発生する', () => {
  it('should throw InvalidRoleError when undefined role is specified', async () => {
    const input = {
      role: 'undefined_role',
      status: undefined,
      siteId: undefined,
      requestingUserId: 'user-001',
    };

    await expect(findUsersByRole(input)).rejects.toThrow('指定された役割は無効です。');
  });
});