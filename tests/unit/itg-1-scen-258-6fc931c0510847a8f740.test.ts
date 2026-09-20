import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

jest.mock('../../src/logic/dashboard-aggregation', () => {
  const actual = jest.requireActual('../../src/logic/dashboard-aggregation');
  return {
    ...actual,
    validateDateTimeRange: jest.fn(),
    listProductivityDataByCondition: jest.fn(),
    listProgressDataByCondition: jest.fn(),
    listDelayRiskJudgmentByCondition: jest.fn(),
    listAllocationExecutionStatusByCondition: jest.fn(),
    listHandyTerminalSyncLogByCondition: jest.fn(),
    listWorkInstructionReceptionHistoryByCondition: jest.fn(),
  };
});

import {
  validateDateTimeRange,
  listProductivityDataByCondition,
  listProgressDataByCondition,
  listDelayRiskJudgmentByCondition,
  listAllocationExecutionStatusByCondition,
  listHandyTerminalSyncLogByCondition,
  listWorkInstructionReceptionHistoryByCondition,
} from '../../src/logic/dashboard-aggregation';

describe('SCEN-258: ダッシュボード統合データセット生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('拠点別・チーム別の進捗状況、納期遅延リスク、人員配置実行状況、改善指示配信履歴を集約し、ダッシュボード画面表示用の統合データセットを生成する', async () => {
    // テスト入力値を準備
    const input = {
      facilityIds: ['F001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER123',
    };

    // validateDateTimeRangeをスタブ化し、正常系の戻り値を返すように設定
    (validateDateTimeRange as jest.Mock).mockReturnValue(true);

    // スタブデータを準備
    const mockProgressData = [
      {
        facilityId: 'F001',
        facilityName: '拠点A',
        teamId: 'T001',
        teamName: 'チームA',
        completionRate: 75,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 85,
      },
      {
        facilityId: 'F001',
        facilityName: '拠点A',
        teamId: 'T002',
        teamName: 'チームB',
        completionRate: 60,
        delayFlag: true,
        delayDays: 2,
        allocationEfficiency: 70,
      },
    ];

    const mockDelayRiskResults = [
      {
        riskJudgmentId: 'R001',
        workInstructionId: 'W001',
        facilityId: 'F001',
        teamId: 'T002',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        currentProgressRate: 60,
        plannedProgressRate: 80,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T10:00:00Z',
      },
    ];

    const mockAllocationStatus = [
      {
        allocationExecutionStatusId: 'A001',
        allocationPlanId: 'AP001',
        workInstructionId: 'W001',
        workerId: 'WK001',
        facilityId: 'F001',
        teamId: 'T002',
        allocationState: '配置中',
        plannedWorkHours: 40,
        actualWorkHours: 30,
        progressRate: 75,
        delayFlag: false,
        plannedStartDateTime: '2024-01-10T09:00:00Z',
        plannedEndDateTime: '2024-01-12T18:00:00Z',
        actualStartDateTime: '2024-01-10T09:00:00Z',
        actualEndDateTime: null,
      },
    ];

    const mockHandyTerminalLog = [
      {
        syncLogId: 'S001',
        workerId: 'WK001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T14:30:00Z',
        receiveDateTime: '2024-01-15T14:31:00Z',
        processingCompleteDateTime: '2024-01-15T14:32:00Z',
      },
    ];

    const mockDeliveryHistory = [
      {
        deliveryHistoryId: 'D001',
        facilityId: 'F001',
        teamId: 'T002',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-15T10:05:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 4,
      },
    ];

    const mockProductivityData = [
      {
        workerId: 'WK001',
        facilityId: 'F001',
        teamId: 'T001',
        avgOrdersPerHour: 12.5,
        avgErrorRate: 2.3,
      },
      {
        workerId: 'WK002',
        facilityId: 'F001',
        teamId: 'T002',
        avgOrdersPerHour: 10.8,
        avgErrorRate: 3.1,
      },
    ];

    // listProductivityDataByConditionをスタブ化：複数チームの作業者ごとの生産性データを返す
    (listProductivityDataByCondition as jest.Mock).mockResolvedValue(mockProductivityData);

    // listProgressDataByConditionをスタブ化
    (listProgressDataByCondition as jest.Mock).mockResolvedValue(mockProgressData);

    // listDelayRiskJudgmentByConditionをスタブ化
    (listDelayRiskJudgmentByCondition as jest.Mock).mockResolvedValue(mockDelayRiskResults);

    // listAllocationExecutionStatusByConditionをスタブ化
    (listAllocationExecutionStatusByCondition as jest.Mock).mockResolvedValue(mockAllocationStatus);

    // listHandyTerminalSyncLogByConditionをスタブ化
    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue(mockHandyTerminalLog);

    // listWorkInstructionReceptionHistoryByConditionをスタブ化：改善指示配信履歴を返す
    (listWorkInstructionReceptionHistoryByCondition as jest.Mock).mockResolvedValue(mockDeliveryHistory);

    // aggregateDashboardData関数を呼び出す
    const beforeCallTime = new Date();
    const result = await aggregateDashboardData(input);
    const afterCallTime = new Date();

    // 戻り値の型確認：すべてのフィールドが存在することを検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('progressByFacilityAndTeam');
    expect(result).toHaveProperty('delayRiskJudgmentResults');
    expect(result).toHaveProperty('allocationExecutionStatus');
    expect(result).toHaveProperty('handyTerminalSyncLog');
    expect(result).toHaveProperty('improvementInstructionDeliveryHistory');
    expect(result).toHaveProperty('aggregationTimestamp');

    // progressByFacilityAndTeamの検証：拠点F001配下の全チームの進捗データが集約されていることを確認
    expect(result.progressByFacilityAndTeam).not.toHaveLength(0);
    expect(result.progressByFacilityAndTeam).toHaveLength(mockProgressData.length);
    expect(result.progressByFacilityAndTeam).toEqual(expect.arrayContaining([
      expect.objectContaining({
        facilityId: 'F001',
        teamId: 'T001',
        completionRate: 75,
        delayFlag: false,
      }),
      expect.objectContaining({
        facilityId: 'F001',
        teamId: 'T002',
        completionRate: 60,
        delayFlag: true,
        delayDays: 2,
      }),
    ]));

    // delayRiskJudgmentResultsの検証：スタブから返却されたリスク判定結果が完全に含まれていることを確認
    expect(result.delayRiskJudgmentResults).not.toHaveLength(0);
    expect(result.delayRiskJudgmentResults).toEqual(expect.arrayContaining([
      expect.objectContaining({
        riskJudgmentId: 'R001',
        workInstructionId: 'W001',
        facilityId: 'F001',
        teamId: 'T002',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        currentProgressRate: 60,
        plannedProgressRate: 80,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
      }),
    ]));

    // allocationExecutionStatusの検証：スタブから返却された人員配置実行状況データが完全に含まれていることを確認
    expect(result.allocationExecutionStatus).not.toHaveLength(0);
    expect(result.allocationExecutionStatus).toEqual(expect.arrayContaining([
      expect.objectContaining({
        allocationExecutionStatusId: 'A001',
        allocationPlanId: 'AP001',
        workInstructionId: 'W001',
        workerId: 'WK001',
        facilityId: 'F001',
        teamId: 'T002',
        allocationState: '配置中',
        plannedWorkHours: 40,
        actualWorkHours: 30,
        progressRate: 75,
        delayFlag: false,
      }),
    ]));

    // handyTerminalSyncLogの検証：スタブから返却されたハンディターミナル連携ログが完全に含まれていることを確認
    expect(result.handyTerminalSyncLog).not.toHaveLength(0);
    expect(result.handyTerminalSyncLog).toEqual(expect.arrayContaining([
      expect.objectContaining({
        syncLogId: 'S001',
        workerId: 'WK001',
        facilityId: 'F001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T14:30:00Z',
        receiveDateTime: '2024-01-15T14:31:00Z',
        processingCompleteDateTime: '2024-01-15T14:32:00Z',
      }),
    ]));

    // improvementInstructionDeliveryHistoryの検証：スタブから返却された改善指示配信履歴が完全に含まれていることを確認
    expect(result.improvementInstructionDeliveryHistory).not.toHaveLength(0);
    expect(result.improvementInstructionDeliveryHistory).toEqual(expect.arrayContaining([
      expect.objectContaining({
        deliveryHistoryId: 'D001',
        facilityId: 'F001',
        teamId: 'T002',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-15T10:05:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 4,
      }),
    ]));

    // aggregationTimestampの検証：呼び出し時刻以降のISO 8601形式文字列であることを確認
    expect(result.aggregationTimestamp).toBeTruthy();
    const timestamp = new Date(result.aggregationTimestamp);
    expect(timestamp.toISOString()).toBe(result.aggregationTimestamp);
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterCallTime.getTime() + 1000);

    // 依存関数の呼び出しを検証
    expect(validateDateTimeRange).toHaveBeenCalledWith(
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listProductivityDataByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.teamIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listProgressDataByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.teamIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listDelayRiskJudgmentByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.teamIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listAllocationExecutionStatusByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.teamIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listHandyTerminalSyncLogByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );

    expect(listWorkInstructionReceptionHistoryByCondition).toHaveBeenCalledWith(
      input.facilityIds,
      input.aggregationStartDateTime,
      input.aggregationEndDateTime
    );
  });
});