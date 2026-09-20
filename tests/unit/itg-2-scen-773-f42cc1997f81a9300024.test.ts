import { deliverPlacementInstructionToFieldLeader } from '../../src/logic/notification-and-integration';

describe('SCEN-773: 代表的な正常入力で配置指示が全チャネルで配信され追跡IDが返される', () => {
  it('should deliver placement instructions to field leader through all channels and return tracking IDs', async () => {
    // テスト前提条件の準備
    const fieldLeaderId = 'FL001';
    const placementInstructions = [
      {
        workerId: 'W001',
        workerName: '作業者太郎',
        currentDepartmentId: 'DEPT_001',
        newDepartmentId: 'DEPT_002',
        newDepartmentName: '製造部',
        newJobTitle: 'ラインリーダー',
        expectedProductivityTarget: 120,
        placementReason: '生産性向上のための最適配置',
        estimatedProductivityImprovement: 15,
      },
      {
        workerId: 'W002',
        workerName: '作業者花子',
        currentDepartmentId: 'DEPT_001',
        newDepartmentId: 'DEPT_003',
        newDepartmentName: '品質管理部',
        newJobTitle: '検査担当',
        expectedProductivityTarget: 100,
        placementReason: '品質改善のための配置',
        estimatedProductivityImprovement: 10,
      },
    ];

    const input = {
      fieldLeaderId,
      placementInstructions,
      instructionTitle: '2025年1月生産性最適化配置',
      instructionContent: '分析結果に基づく最適人員配置のご指示です',
      executionStartDate: '2025-01-15T08:00:00Z',
      executionDeadline: '2025-01-31T17:00:00Z',
      priorityLevel: 'HIGH' as const,
      requestedBy: 'ADMIN_001',
      relatedAnalysisId: 'ANALYSIS_123',
      deliveryChannels: ['EMAIL', 'SMS', 'APP_NOTIFICATION', 'SYSTEM_MESSAGE'] as const,
    };

    // 関数を呼び出す
    const result = await deliverPlacementInstructionToFieldLeader(input);

    // success フィールドを確認
    expect(result.success).toBe(true);

    // instructionTrackingId フィールドを確認（英数字の追跡ID文字列）
    expect(result.instructionTrackingId).toBeDefined();
    expect(typeof result.instructionTrackingId).toBe('string');
    expect(result.instructionTrackingId).toMatch(/^[A-Z0-9\-]+$/);

    // deliveredAt フィールドを確認（ISO 8601形式で現在時刻の±5秒以内）
    expect(result.deliveredAt).toBeDefined();
    expect(typeof result.deliveredAt).toBe('string');
    const deliveredTime = new Date(result.deliveredAt).getTime();
    const nowTime = Date.now();
    expect(Math.abs(deliveredTime - nowTime)).toBeLessThanOrEqual(5000);

    // deliveryChannelsUsed フィールドを確認（全要素を含む）
    expect(result.deliveryChannelsUsed).toBeDefined();
    expect(Array.isArray(result.deliveryChannelsUsed)).toBe(true);
    expect(result.deliveryChannelsUsed).toContain('EMAIL');
    expect(result.deliveryChannelsUsed).toContain('SMS');
    expect(result.deliveryChannelsUsed).toContain('APP_NOTIFICATION');
    expect(result.deliveryChannelsUsed).toContain('SYSTEM_MESSAGE');

    // fieldLeaderContactInfo フィールドを確認（メールアドレスまたは電話番号）
    expect(result.fieldLeaderContactInfo).toBeDefined();
    expect(typeof result.fieldLeaderContactInfo).toBe('string');
    expect(result.fieldLeaderContactInfo.length).toBeGreaterThan(0);

    // estimatedReceiptTime フィールドを確認（ISO 8601形式）
    expect(result.estimatedReceiptTime).toBeDefined();
    expect(typeof result.estimatedReceiptTime).toBe('string');
    new Date(result.estimatedReceiptTime);
    expect(() => new Date(result.estimatedReceiptTime)).not.toThrow();

    // errorMessage フィールドを確認（null である）
    expect(result.errorMessage).toBeNull();

    // partialDeliveryInfo フィールドを確認（null である）
    expect(result.partialDeliveryInfo).toBeNull();
  });
});