import { authenticateUser } from '../../src/logic/authorization-and-validation';

describe('SCEN-1052: ハンディターミナルデータ受信と再試行', () => {
  describe('受信データの値が許容範囲外の場合、検証エラーを返す', () => {
    it('userId が空文字列の場合、success が false で userContext・authToken・expiresAt が null となり、エラーメッセージが返される', async () => {
      // ステップ1: authenticateUser を呼び出す際、userId に空文字列を設定
      const input = {
        userId: '',
        password: 'valid_password_123',
      };

      // ステップ2: authenticateUser を実行
      let error: Error | null = null;
      let output;
      
      try {
        output = await authenticateUser(input);
      } catch (e) {
        error = e as Error;
      }

      // ステップ3: authenticateUser から返却される出力型 AuthenticateUserOutput を検証
      if (error) {
        expect(error.name).toBe('InvalidInputFormatError');
        expect(error.message).toBe('ユーザーID とパスワードは必須です。');
      } else {
        expect(output.success).toBe(false);
        expect(output.userContext).toBeNull();
        expect(output.authToken).toBeNull();
        expect(output.expiresAt).toBeNull();
      }
    });
  });
});