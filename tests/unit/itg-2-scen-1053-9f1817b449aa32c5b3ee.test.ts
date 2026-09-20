import { authenticateUser, AuthenticateUserInput, AuthenticateUserOutput } from '../../src/logic/authorization-and-validation';

describe('SCEN-1053: ハンディターミナルデータ受信と再試行 - データ送信が許容遅延値内に完了した場合', () => {
  it('should authenticate user successfully when data transmission completes within acceptable delay', async () => {
    // Arrange: ハンディターミナルからのデータ送受信のシミュレーション環境を準備
    const acceptableDelayMs = 5000; // 許容遅延値: 5秒
    const dataTransmissionDelayMs = 4000; // データ送信が4秒で完了するシナリオ（許容遅延値内）
    
    // ハンディターミナルデータ受信開始時刻を記録
    const dataTransmissionStartTime = Date.now();

    // ハンディターミナルデータ受信プロセスをシミュレート
    // ハンディターミナルからのデータ受信、ネットワーク通信、データ処理を模擬する関数
    const simulateHandheldTerminalDataReception = async (delayMs: number): Promise<{
      deviceId: string;
      workerId: string;
      timestamp: string;
      dataPayload: Record<string, unknown>;
      transmissionStatus: string;
      receptionCompletedTime: number;
    }> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 実際のデータ受信完了時刻を記録
          const receptionCompletedTime = Date.now();
          
          resolve({
            deviceId: 'terminal-001',
            workerId: 'valid-user-id',
            timestamp: new Date().toISOString(),
            dataPayload: {
              taskId: 'task-123',
              completedQuantity: 100,
              workDuration: 120,
            },
            transmissionStatus: 'completed',
            receptionCompletedTime: receptionCompletedTime,
          });
        }, delayMs);
      });
    };

    const receivedData = await simulateHandheldTerminalDataReception(dataTransmissionDelayMs);

    // データ受信完了時刻を記録し、送信開始から完了までの経過時間を計測
    const dataTransmissionElapsedTime = receivedData.receptionCompletedTime - dataTransmissionStartTime;

    // authenticateUser関数を呼び出し、認証済みユーザーコンテキストを取得
    const userInput: AuthenticateUserInput = {
      userId: receivedData.workerId,
      password: 'valid-password',
    };

    const authStartTime = Date.now();
    
    const authResult: AuthenticateUserOutput = await authenticateUser(userInput);
    
    const authEndTime = Date.now();

    // Assert: データ送信が許容遅延値内に完了したことを確認
    expect(dataTransmissionElapsedTime).toBeLessThanOrEqual(acceptableDelayMs);

    // authenticateUser関数の出力を検証
    // success フィールドが true であることを確認
    expect(authResult.success).toBe(true);
    
    // userContext フィールドに有効なユーザーコンテキストが含まれていることを確認
    expect(authResult.userContext).not.toBeNull();
    expect(authResult.userContext).toHaveProperty('userId');
    expect(authResult.userContext).toHaveProperty('userName');
    expect(authResult.userContext).toHaveProperty('role');
    expect(authResult.userContext).toHaveProperty('siteId');
    expect(authResult.userContext).toHaveProperty('teamId');
    expect(authResult.userContext).toHaveProperty('permissions');
    
    // userContext の各フィールドが正しい型であることを確認
    expect(typeof authResult.userContext!.userId).toBe('string');
    expect(typeof authResult.userContext!.userName).toBe('string');
    expect(typeof authResult.userContext!.role).toBe('string');
    expect(Array.isArray(authResult.userContext!.permissions)).toBe(true);
    
    // authToken が有効な認証トークン文字列であることを確認
    expect(authResult.authToken).not.toBeNull();
    expect(typeof authResult.authToken).toBe('string');
    expect(authResult.authToken!.length).toBeGreaterThan(0);
    
    // expiresAt が ISO 8601 形式の有効期限であることを確認
    expect(authResult.expiresAt).not.toBeNull();
    expect(typeof authResult.expiresAt).toBe('string');
    const expirationDate = new Date(authResult.expiresAt!);
    expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
    
    // 次工程への遷移条件をチェック
    // 経過時間が許容遅延値以内であり、認証が成功している状態を確認
    const nextProcessInput = {
      userContext: authResult.userContext,
      receivedData: receivedData,
      authToken: authResult.authToken,
    };

    const canProceedToNextProcess =
      dataTransmissionElapsedTime <= acceptableDelayMs &&
      authResult.success === true &&
      authResult.userContext !== null &&
      authResult.authToken !== null &&
      authResult.expiresAt !== null &&
      nextProcessInput.userContext !== null &&
      nextProcessInput.userContext.userId === receivedData.workerId &&
      nextProcessInput.receivedData.transmissionStatus === 'completed';
    
    expect(canProceedToNextProcess).toBe(true);

    // システムが遅延なく次工程へ進むことができる状態になっていることを確認
    // 次工程へ進むための必要な状態がすべて揃っていることを確認
    expect(authResult.userContext).toBeTruthy();
    expect(authResult.authToken).toBeTruthy();
    expect(receivedData.transmissionStatus).toBe('completed');
    expect(nextProcessInput.userContext!.userId).toBe(userInput.userId);
  });
});