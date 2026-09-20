import { authenticateUser } from '../../src/logic/auth-authorization-audit';
import * as bcrypt from 'bcrypt';

describe('SCEN-347: ユーザーIDが存在しないか、パスワードハッシュが一致しない場合、InvalidCredentialsErrorが発生する', () => {
  describe('ユーザーが存在しないケース', () => {
    it('userAuthDataがnullの場合、InvalidCredentialsErrorが発生する', async () => {
      const input = {
        userId: 'nonexistent-user-001',
        passwordPlaintext: '入力パスワード',
        ipAddress: '192.168.1.100',
        userAuthData: null as any,
      };

      await expect(authenticateUser(input)).rejects.toThrow('InvalidCredentialsError');
      await expect(authenticateUser(input)).rejects.toMatchObject({
        message: 'ユーザーID またはパスワードが正しくありません。',
      });
    });

    it('userAuthDataがundefinedの場合、InvalidCredentialsErrorが発生する', async () => {
      const input = {
        userId: 'nonexistent-user-001',
        passwordPlaintext: '入力パスワード',
        ipAddress: '192.168.1.100',
        userAuthData: undefined as any,
      };

      await expect(authenticateUser(input)).rejects.toThrow('InvalidCredentialsError');
      await expect(authenticateUser(input)).rejects.toMatchObject({
        message: 'ユーザーID またはパスワードが正しくありません。',
      });
    });

    it('ユーザー存在しないケースでのエラーハンドリングを検証：AuthenticateUserOutputは返却されない', async () => {
      const input = {
        userId: 'nonexistent-user-001',
        passwordPlaintext: '入力パスワード',
        ipAddress: '192.168.1.100',
        userAuthData: null as any,
      };

      try {
        await authenticateUser(input);
        fail('例外が発生することが期待されます');
      } catch (error: any) {
        expect(error.name).toBe('InvalidCredentialsError');
        expect(error.message).toBe('ユーザーID またはパスワードが正しくありません。');
        expect(error).not.toHaveProperty('sessionToken');
        expect(error).not.toHaveProperty('userId');
        expect(error).not.toHaveProperty('userName');
        expect(error).not.toHaveProperty('role');
        expect(error).not.toHaveProperty('facilityId');
        expect(error).not.toHaveProperty('teamId');
        expect(error).not.toHaveProperty('sessionExpiresAt');
      }
    });
  });

  describe('パスワードが一致しないケース', () => {
    it('入力されたパスワードがuserAuthDataのパスワードハッシュと一致しない場合、InvalidCredentialsErrorが発生する', async () => {
      const correctPassword = 'correct-password-123';
      const correctHash = bcrypt.hashSync(correctPassword, 10);
      const wrongPassword = '入力パスワード';

      const input = {
        userId: 'valid-user-001',
        passwordPlaintext: wrongPassword,
        ipAddress: '192.168.1.100',
        userAuthData: {
          userId: 'valid-user-001',
          userName: 'Test User',
          passwordHash: correctHash,
          status: 'active',
          role: 'worker',
          facilityId: 'facility-001',
          teamId: 'team-001',
        },
      };

      await expect(authenticateUser(input)).rejects.toThrow('InvalidCredentialsError');
      await expect(authenticateUser(input)).rejects.toMatchObject({
        message: 'ユーザーID またはパスワードが正しくありません。',
      });
    });

    it('パスワード不一致ケースでのエラーハンドリングを検証：AuthenticateUserOutputは返却されない', async () => {
      const correctPassword = 'correct-password-456';
      const correctHash = bcrypt.hashSync(correctPassword, 10);
      const wrongPassword = '別のパスワード';

      const input = {
        userId: 'valid-user-001',
        passwordPlaintext: wrongPassword,
        ipAddress: '192.168.1.100',
        userAuthData: {
          userId: 'valid-user-001',
          userName: 'Test User',
          passwordHash: correctHash,
          status: 'active',
          role: 'worker',
          facilityId: null,
          teamId: null,
        },
      };

      try {
        await authenticateUser(input);
        fail('例外が発生することが期待されます');
      } catch (error: any) {
        expect(error.name).toBe('InvalidCredentialsError');
        expect(error.message).toBe('ユーザーID またはパスワードが正しくありません。');
        expect(error).not.toHaveProperty('sessionToken');
        expect(error).not.toHaveProperty('userId');
        expect(error).not.toHaveProperty('userName');
        expect(error).not.toHaveProperty('role');
        expect(error).not.toHaveProperty('facilityId');
        expect(error).not.toHaveProperty('teamId');
        expect(error).not.toHaveProperty('sessionExpiresAt');
      }
    });
  });
});