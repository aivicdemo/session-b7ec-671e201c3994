import { deliverPlacementInstructionToFieldLeader } from '../../src/logic/notification-and-integration';

describe('SCEN-779: 複数の配置指示が1件の入力に含まれる場合すべての作業者に対する指示が配信される', () => {
  it('複数の作業者に対する配置指示がすべての配信チャネルを通じて配信される', async () => {
    const fieldLeaderId = 'leader-001';
    const placementInstructions = [
      {
        workerId: 'worker-001',
        workerName: '田中太郎',
        currentDepartmentId: 'dept-001',
        newDepartmentId: 'dept-002',
        newDepartmentName: '製造部B',
        newJobTitle: 'ラインリーダー',
        expectedProductivityTarget: 120,
        placementReason: '生産性向上',
        estimatedProductivityImprovement: 15,
      },
      {
        workerId: 'worker-002',
        workerName: '鈴木花子',
        currentDepartmentId: 'dept-001',
        newDepartmentId: 'dept-003',
        newDepartmentName: '品質管理部',
        newJobTitle: '検査員',
        expectedProductivityTarget: 100,
        placementReason: '品質改善',
        estimatedProductivityImprovement: 10,
      },
      {
        workerId: 'worker-003',
        workerName: '佐藤次郎',
        currentDepartmentId: 'dept-002',
        newDepartmentId: 'dept-004',
        newDepartmentName: '梱包部',
        newJobTitle: '梱包作業者',
        expectedProductivityTarget: 90,
        placementReason: '進捗遅延対応',
        estimatedProductivityImprovement: 8,
      },
    ];

    const input = {
      fieldLeaderId,
      placementInstructions,
      instructionTitle: '複数配置指示',
      instructionContent: '3名の作業者を異なる部門に配置',
      executionStartDate: '2024-01-15T08:00:00Z',
      executionDeadline: '2024-01-15T18:00:00Z',
      priorityLevel: 'HIGH' as const,
      requestedBy: 'admin-001',
      relatedAnalysisId: 'analysis-123',
      deliveryChannels: ['EMAIL', 'APP_NOTIFICATION'] as const,
    };

    const result = await deliverPlacementInstructionToFieldLeader(input);

    expect(result.success).toBe(true);
    expect(result.instructionTrackingId).toBeDefined();
    expect(typeof result.instructionTrackingId).toBe('string');
    expect(result.instructionTrackingId.length).toBeGreaterThan(0);

    expect(result.deliveredAt).toBeDefined();
    expect(typeof result.deliveredAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(result.deliveredAt)).toBe(true);

    expect(result.deliveryChannelsUsed).toBeDefined();
    expect(Array.isArray(result.deliveryChannelsUsed)).toBe(true);
    expect(result.deliveryChannelsUsed).toContain('EMAIL');
    expect(result.deliveryChannelsUsed).toContain('APP_NOTIFICATION');

    expect(result.fieldLeaderContactInfo).toBeDefined();
    expect(typeof result.fieldLeaderContactInfo).toBe('string');
    expect(result.fieldLeaderContactInfo.length).toBeGreaterThan(0);

    expect(result.estimatedReceiptTime).toBeDefined();
    expect(typeof result.estimatedReceiptTime).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(result.estimatedReceiptTime)).toBe(true);

    expect(result.errorMessage).toBeNull();
    expect(result.partialDeliveryInfo).toBeNull();
  });
});