import { saveUser } from '../../src/logic/persistence-layer';

describe('SCEN-405: ユーザーデータ保存時の必須フィールド検証エラー', () => {
  it('userIdが空文字列の場合、InvalidUserDataErrorが発生する', async () => {
    const invalidInput = {
      userId: '',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: '田中太郎',
      role: 'worker',
      status: 'active',
      createdBy: 'admin1',
      requestingUserId: 'admin1',
    };

    await expect(saveUser(invalidInput)).rejects.toThrow(
      'ユーザーデータの必須フィールドまたは形式が不正です。'
    );
  });

  it('userNameが空文字列の場合、InvalidUserDataErrorが発生する', async () => {
    const invalidInput = {
      userId: 'user-123',
      userName: '',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: '田中太郎',
      role: 'worker',
      status: 'active',
      createdBy: 'admin1',
      requestingUserId: 'admin1',
    };

    await expect(saveUser(invalidInput)).rejects.toThrow(
      'ユーザーデータの必須フィールドまたは形式が不正です。'
    );
  });

  it('emailが空文字列の場合、InvalidUserDataErrorが発生する', async () => {
    const invalidInput = {
      userId: 'user-123',
      userName: 'testuser',
      email: '',
      passwordHash: 'hash123',
      fullName: '田中太郎',
      role: 'worker',
      status: 'active',
      createdBy: 'admin1',
      requestingUserId: 'admin1',
    };

    await expect(saveUser(invalidInput)).rejects.toThrow(
      'ユーザーデータの必須フィールドまたは形式が不正です。'
    );
  });

  it('fullNameが空文字列の場合、InvalidUserDataErrorが発生する', async () => {
    const invalidInput = {
      userId: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: '',
      role: 'worker',
      status: 'active',
      createdBy: 'admin1',
      requestingUserId: 'admin1',
    };

    await expect(saveUser(invalidInput)).rejects.toThrow(
      'ユーザーデータの必須フィールドまたは形式が不正です。'
    );
  });

  it('roleが空文字列の場合、InvalidUserDataErrorが発生する', async () => {
    const invalidInput = {
      userId: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash123',
      fullName: '田中太郎',
      role: '',
      status: 'active',
      createdBy: 'admin1',
      requestingUserId: 'admin1',
    };

    await expect(saveUser(invalidInput)).rejects.toThrow(
      'ユーザーデータの必須フィールドまたは形式が不正です。'
    );
  });
});