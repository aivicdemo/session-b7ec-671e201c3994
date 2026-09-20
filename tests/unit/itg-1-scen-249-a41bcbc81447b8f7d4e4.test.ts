import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dataSource from '../../src/data/data-source';
import * as logger from '../../src/infrastructure/logger';

jest.mock('../../src/data/data-source');
jest.mock('../../src/infrastructure/logger');

describe('SCEN-249: 作業進捗・人員配置最適化エンジン - 生産性ベースラインデータ不足時の警告', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('生産性データが空の場合、警告ログを記録し、ダッシュボード集約データを正常に返却する', async () => {
    // 1. テスト用の基本入力データを準備
    const input = {
      facilityIds: ['F001'],
      teamIds: ['T001', 'T002'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-01T08:00:00Z',
      requestUserId: 'user123',
    };

    // 2-4. スタブ処理の設定
    (dataSource.listProductivityDataByCondition as jest.Mock).mockResolvedValue([]);

    (dataSource.listProgressDataByCondition as jest.Mock).mockResolvedValue([
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-01T08:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 45,
        completionRate: 45,
        delayFlag: false,
        delayDays: null,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F001',
        teamId: 'T002',
        progressDate: '2024-01-01T08:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 52,
        completionRate: 52,
        delayFlag: false,
        delayDays: null,
      },
    ]);

    (dataSource.listDelayRiskJudgmentByCondition as jest.Mock).mockResolvedValue([
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 45,
        plannedProgressRate: 50,
        delayReason: 'なし',
        recommendedAction: 'なし',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-01T08:00:00Z',
      },
    ]);

    (dataSource.listAllocationExecutionStatusByCondition as jest.Mock).mockResolvedValue([
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 4,
        progressRate: 50,
        delayFlag: false,
        plannedStartDateTime: '2024-01-01T00:00:00Z',
        plannedEndDateTime: '2024-01-01T08:00:00Z',
        actualStartDateTime: '2024-01-01T00:00:00Z',
        actualEndDateTime: null,
      },
    ]);

    (dataSource.listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue([
      {
        syncLogId: 'SL001',
        workerId: 'W001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-01T04:00:00Z',
        receiveDateTime: '2024-01-01T04:01:00Z',
        processingCompleteDateTime: '2024-01-01T04:02:00Z',
      },
    ]);

    (dataSource.listImprovementInstructionDeliveryHistoryByCondition as jest.Mock).mockResolvedValue([
      {
        deliveryHistoryId: 'DH001',
        facilityId: 'F001',
        teamId: 'T001',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-01T06:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 4,
      },
    ]);

    (dataSource.validateDateTimeRange as jest.Mock).mockResolvedValue(undefined);

    // 5. 対象処理を呼び出す
    let result;
    let thrownError;

    try {
      result = await aggregateDashboardData(input);
    } catch (error) {
      thrownError = error;
    }

    // 6. ログ出力を検証 - 警告レベルで正確なメッセージが記録されたことを確認
    expect(logger.warn).toHaveBeenCalledWith(
      '過去の生産性データが不足しています。効率スコアは参考値です'
    );

    // 7. 出力型が正常に返却されることを確認（エラーが発生していないことを検証）
    expect(thrownError).toBeUndefined();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('progressByFacilityAndTeam');
    expect(result).toHaveProperty('delayRiskJudgmentResults');
    expect(result).toHaveProperty('allocationExecutionStatus');
    expect(result).toHaveProperty('handyTerminalSyncLog');
    expect(result).toHaveProperty('improvementInstructionDeliveryHistory');
    expect(result).toHaveProperty('aggregationTimestamp');

    // 8. 各出力フィールドが有効なデータを含むことを確認
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    // 9. aggregationTimestamp が ISO 8601形式で現在時刻近辺の値を持つことを確認
    const timestamp = new Date(result.aggregationTimestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
    expect(timeDiff).toBeLessThan(60000);
  });
});