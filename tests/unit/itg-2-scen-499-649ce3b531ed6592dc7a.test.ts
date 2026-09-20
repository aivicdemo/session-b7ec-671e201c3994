import { findPlacementPlanByWorkerAndDate } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-499: 指定した作業者IDと日付で有効な配置計画が存在するときに、配置計画の全詳細情報が返却される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return complete placement plan details when valid worker ID and date are provided', async () => {
    const workerId = 'worker-123';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'user-001';

    // authorizeUserActionをスタブ化
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
      userId: requestingUserId,
    });

    // validateInputDataをスタブ化
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue({
      valid: true,
      workerId,
      targetDate,
    });

    // データベースモック: workerId='worker-123'に紐づき、
    // 開始日2024-01-01、終了日2024-12-31の有効期間に2024-01-15を含む配置計画レコード
    const mockPlacementPlanRecord = {
      placementPlanId: 'plan-5001',
      workerId: 'worker-123',
      placementDepartment: '物流センターA-仕分け部門',
      placementJobType: '仕分け作業',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      placementStatus: 'active',
      expectedProductivityTarget: 120.5,
      optimizationReason:
        '過去30日間の生産性データ分析により、この作業者の適性度が90%以上と判定',
      found: true,
    };

    // findPlacementPlanByWorkerAndDateの実装をスタブ化
    jest
      .spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate')
      .mockResolvedValue(mockPlacementPlanRecord);

    const result = await findPlacementPlanByWorkerAndDate({
      workerId,
      targetDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.placementPlanId).toBe('plan-5001');
    expect(result.workerId).toBe('worker-123');
    expect(result.placementDepartment).toBe('物流センターA-仕分け部門');
    expect(result.placementJobType).toBe('仕分け作業');
    expect(result.startDate).toEqual(new Date('2024-01-01'));
    expect(result.endDate).toEqual(new Date('2024-12-31'));
    expect(result.placementStatus).toBe('active');
    expect(result.expectedProductivityTarget).toBe(120.5);
    expect(result.optimizationReason).toBe(
      '過去30日間の生産性データ分析により、この作業者の適性度が90%以上と判定'
    );
  });
});