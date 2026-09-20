import { deliverImprovementInstructionToFacility } from '../../src/logic/notification-external-integration';
import * as notificationModule from '../../src/logic/notification-external-integration';

describe('SCEN-1186: リクエストユーザーが改善指示配信の権限を持たない場合、UnauthorizedUserエラーが発生する', () => {
  it('権限なしユーザーが改善指示配信を実行するとUnauthorizedUserエラーが発生', async () => {
    // authorizeOperation のモック設定
    const authorizeOperationSpy = jest.spyOn(notificationModule as any, 'authorizeOperation').mockImplementation((userId: string, facilityId: string) => {
      const error = new Error('改善指示配信の権限がありません。');
      (error as any).name = 'UnauthorizedUser';
      throw error;
    });

    // recordWorkInstructionDeliveryHistory のモック設定（呼び出されてはいけない）
    const recordHistorySpy = jest.spyOn(notificationModule as any, 'recordWorkInstructionDeliveryHistory').mockResolvedValue({
      success: true,
      receptionHistoryId: 'hist-001',
      workInstructionId: 'work-001',
      recipientUserId: 'user-001',
      deliveryChannel: 'email' as const,
      recordedAt: new Date(),
      failureReason: null,
    });

    const testInput = {
      delayRiskJudgmentId: 'risk-001',
      facilityId: 'fac-001',
      teamId: null as string | null,
      improvementInstructions: [
        {
          instructionType: 'add_personnel' as const,
          description: 'Add 2 staff members',
          targetWorkInstructionIds: [],
        },
      ],
      deliveryChannels: ['email', 'app_notification'] as const[],
      priority: 'high' as const,
      requestedByUserId: 'user-unauthorized',
      requestedAt: new Date(),
    };

    let errorCaught: Error | null = null;
    let result: any = null;

    try {
      result = await deliverImprovementInstructionToFacility(testInput);
    } catch (error) {
      errorCaught = error as Error;
    }

    // 権限チェック例外が発生したことを検証
    expect(errorCaught).not.toBeNull();
    expect((errorCaught as any).name).toBe('UnauthorizedUser');
    expect(errorCaught?.message).toBe('改善指示配信の権限がありません。');
    
    // authorizeOperation が指定の引数で呼び出されたことを確認
    expect(authorizeOperationSpy).toHaveBeenCalledWith('user-unauthorized', 'fac-001');
    
    // 配信処理が実行されず、出力型が返されていないことを検証
    expect(result).toBeUndefined();
    expect(recordHistorySpy).not.toHaveBeenCalled();

    authorizeOperationSpy.mockRestore();
    recordHistorySpy.mockRestore();
  });
});