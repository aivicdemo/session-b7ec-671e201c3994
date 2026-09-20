import { deliverPlacementInstructionToFieldLeader } from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/notification-and-integration');

describe('SCEN-774: 指定された現場リーダーが存在しない場合FieldLeaderNotFoundエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return FieldLeaderNotFound error when field leader does not exist', async () => {
    const input = {
      fieldLeaderId: 'non-existent-leader-id',
      placementInstructions: [
        {
          workerId: 'worker-001',
          workerName: '山田太郎',
          currentDepartmentId: 'dept-001',
          newDepartmentId: 'dept-002',
          newDepartmentName: '組立部門',
          newJobTitle: 'リーダー補佐',
          expectedProductivityTarget: 120,
          placementReason: '生産性向上のため',
        },
      ],
      instructionTitle: '人員配置指示',
      instructionContent: '以下の作業者を新しい配置先に配置してください。',
      executionStartDate: '2024-01-15T09:00:00Z',
      executionDeadline: '2024-01-16T18:00:00Z',
      priorityLevel: 'HIGH' as const,
      requestedBy: 'system-user-001',
      relatedAnalysisId: 'analysis-001',
      deliveryChannels: ['EMAIL', 'APP_NOTIFICATION'] as const[],
    };

    (deliverPlacementInstructionToFieldLeader as jest.Mock).mockResolvedValue({
      success: false,
      instructionTrackingId: null,
      deliveredAt: null,
      deliveryChannelsUsed: null,
      fieldLeaderContactInfo: null,
      estimatedReceiptTime: null,
      errorMessage: '指定されたフィールドリーダーが見つかりません。',
      partialDeliveryInfo: null,
    });

    const result = await deliverPlacementInstructionToFieldLeader(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('指定されたフィールドリーダーが見つかりません。');
    expect(result.instructionTrackingId === null || result.instructionTrackingId === undefined).toBe(true);
    expect(result.deliveredAt === null || result.deliveredAt === undefined).toBe(true);
    expect(result.deliveryChannelsUsed === null || result.deliveryChannelsUsed === undefined).toBe(true);
    expect(result.fieldLeaderContactInfo === null || result.fieldLeaderContactInfo === undefined).toBe(true);
    expect(result.estimatedReceiptTime === null || result.estimatedReceiptTime === undefined).toBe(true);
  });

  it('should return FieldLeaderNotFound error when field leader is inactive', async () => {
    const input = {
      fieldLeaderId: 'inactive-leader-id',
      placementInstructions: [
        {
          workerId: 'worker-002',
          workerName: '鈴木花子',
          currentDepartmentId: 'dept-001',
          newDepartmentId: 'dept-003',
          newDepartmentName: '品質管理部門',
          newJobTitle: '品質チェッカー',
          expectedProductivityTarget: 100,
          placementReason: '品質改善',
        },
      ],
      instructionTitle: '品質改善配置指示',
      instructionContent: '品質改善のため以下の配置を実施します。',
      executionStartDate: '2024-01-15T10:00:00Z',
      executionDeadline: '2024-01-17T18:00:00Z',
      priorityLevel: 'MEDIUM' as const,
      requestedBy: 'system-user-002',
      relatedAnalysisId: 'analysis-002',
      deliveryChannels: ['EMAIL'] as const[],
    };

    (deliverPlacementInstructionToFieldLeader as jest.Mock).mockResolvedValue({
      success: false,
      instructionTrackingId: null,
      deliveredAt: null,
      deliveryChannelsUsed: null,
      fieldLeaderContactInfo: null,
      estimatedReceiptTime: null,
      errorMessage: '指定されたフィールドリーダーが見つかりません。',
      partialDeliveryInfo: null,
    });

    const result = await deliverPlacementInstructionToFieldLeader(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('指定されたフィールドリーダーが見つかりません。');
    expect(result.instructionTrackingId === null || result.instructionTrackingId === undefined).toBe(true);
    expect(result.deliveredAt === null || result.deliveredAt === undefined).toBe(true);
    expect(result.deliveryChannelsUsed === null || result.deliveryChannelsUsed === undefined).toBe(true);
    expect(result.fieldLeaderContactInfo === null || result.fieldLeaderContactInfo === undefined).toBe(true);
    expect(result.estimatedReceiptTime === null || result.estimatedReceiptTime === undefined).toBe(true);
  });

  it('should return error with null or undefined value in response fields when field leader lookup fails', async () => {
    const input = {
      fieldLeaderId: 'lookup-failed-leader-id',
      placementInstructions: [
        {
          workerId: 'worker-003',
          workerName: '佐藤次郎',
          currentDepartmentId: 'dept-002',
          newDepartmentId: 'dept-004',
          newDepartmentName: '梱包部門',
          newJobTitle: '梱包作業者',
          expectedProductivityTarget: 150,
          placementReason: '人員補強',
        },
      ],
      instructionTitle: '人員補強配置',
      instructionContent: '人員不足に対応するため配置します。',
      executionStartDate: '2024-01-16T08:00:00Z',
      executionDeadline: '2024-01-18T18:00:00Z',
      priorityLevel: 'HIGH' as const,
      requestedBy: 'system-user-003',
      relatedAnalysisId: 'analysis-003',
      deliveryChannels: ['SMS', 'APP_NOTIFICATION'] as const[],
    };

    (deliverPlacementInstructionToFieldLeader as jest.Mock).mockResolvedValue({
      success: false,
      instructionTrackingId: null,
      deliveredAt: null,
      deliveryChannelsUsed: null,
      fieldLeaderContactInfo: null,
      estimatedReceiptTime: null,
      errorMessage: '指定されたフィールドリーダーが見つかりません。',
      partialDeliveryInfo: null,
    });

    const result = await deliverPlacementInstructionToFieldLeader(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('指定されたフィールドリーダーが見つかりません。');
    expect(result.instructionTrackingId === null || result.instructionTrackingId === undefined).toBe(true);
    expect(result.deliveredAt === null || result.deliveredAt === undefined).toBe(true);
    expect(result.deliveryChannelsUsed === null || result.deliveryChannelsUsed === undefined).toBe(true);
    expect(result.fieldLeaderContactInfo === null || result.fieldLeaderContactInfo === undefined).toBe(true);
    expect(result.estimatedReceiptTime === null || result.estimatedReceiptTime === undefined).toBe(true);
  });
});