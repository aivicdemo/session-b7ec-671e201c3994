import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import * as dashboardAggregation from '../../src/logic/dashboard-aggregation';

describe('SCEN-264: aggregateDashboardData - delayRiskJudgmentResults output', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return delayRiskJudgmentResults as array of DelayRiskJudgmentResultData with required fields', async () => {
    // 準備：入力パラメータを設定
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'user123',
    };

    // スタブ化：進捗データ
    const mockProgressData = [
      {
        progressDataId: 'PD001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        progressDate: '2024-01-15T00:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: 45,
        delayFlag: true,
        delayDays: 2,
      },
      {
        progressDataId: 'PD002',
        workInstructionId: 'WI002',
        facilityId: 'F002',
        teamId: 'T002',
        progressDate: '2024-01-15T00:00:00Z',
        plannedQuantity: 100,
        actualQuantity: 95,
        completionRate: 60,
        delayFlag: false,
        delayDays: null,
      },
    ];

    // スタブ化：遅延リスク判定結果
    const mockDelayRiskJudgments = [
      {
        riskJudgmentId: 'RJ001',
        workInstructionId: 'WI001',
        facilityId: 'F001',
        teamId: 'T001',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        currentProgressRate: 45,
        plannedProgressRate: 60,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T10:00:00Z',
      },
      {
        riskJudgmentId: 'RJ002',
        workInstructionId: 'WI002',
        facilityId: 'F002',
        teamId: 'T002',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 1,
        currentProgressRate: 60,
        plannedProgressRate: 65,
        delayReason: '効率低下',
        recommendedAction: '優先順位変更',
        actionStatus: '対応中',
        judgmentDateTime: '2024-01-15T10:00:00Z',
      },
      {
        riskJudgmentId: 'RJ003',
        workInstructionId: 'WI003',
        facilityId: 'F001',
        teamId: 'T003',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        currentProgressRate: 85,
        plannedProgressRate: 80,
        delayReason: 'なし',
        recommendedAction: 'なし',
        actionStatus: '完了',
        judgmentDateTime: '2024-01-15T10:00:00Z',
      },
    ];

    // スタブ化：人員配置実行状況
    const mockAllocationExecutionStatus = [
      {
        allocationExecutionStatusId: 'AES001',
        allocationPlanId: 'AP001',
        workInstructionId: 'WI001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 6,
        progressRate: 45,
        delayFlag: true,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: '2024-01-15T09:15:00Z',
        actualEndDateTime: null,
      },
    ];

    // スタブ化：拠点・チームマッピング
    const mockFacilityTeamMapping = [
      { facilityId: 'F001', facilityName: '東京拠点', teamId: 'T001', teamName: 'チームA' },
      { facilityId: 'F001', facilityName: '東京拠点', teamId: 'T003', teamName: 'チームC' },
      { facilityId: 'F002', facilityName: '大阪拠点', teamId: 'T002', teamName: 'チームB' },
    ];

    // モック化：実装内部で使用される依存関数
    jest.spyOn(dashboardAggregation as any, 'validateDateTimeRange').mockReturnValue({ isValid: true });
    jest.spyOn(dashboardAggregation as any, 'listProgressDataByCondition').mockResolvedValue(mockProgressData);
    jest.spyOn(dashboardAggregation as any, 'listDelayRiskJudgmentByCondition').mockResolvedValue(mockDelayRiskJudgments);
    jest.spyOn(dashboardAggregation as any, 'listAllocationExecutionStatusByCondition').mockResolvedValue(mockAllocationExecutionStatus);
    jest.spyOn(dashboardAggregation as any, 'listProductivityDataByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listHandyTerminalSyncLogByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'listImprovementInstructionDeliveryHistoryByCondition').mockResolvedValue([]);
    jest.spyOn(dashboardAggregation as any, 'getFacilityTeamMapping').mockResolvedValue(mockFacilityTeamMapping);

    // 実行：aggregateDashboardDataを呼び出し
    const output = await aggregateDashboardData(input);

    // 検証：delayRiskJudgmentResultsフィールドの確認
    expect(output).toBeDefined();
    expect(output.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgmentResults)).toBe(true);

    // 検証：要素数が0より大きい
    expect(output.delayRiskJudgmentResults.length).toBeGreaterThan(0);

    // 検証：各要素が必須フィールドを持つ
    output.delayRiskJudgmentResults.forEach((result) => {
      expect(result.riskJudgmentId).toBeDefined();
      expect(typeof result.riskJudgmentId).toBe('string');

      expect(result.workInstructionId).toBeDefined();
      expect(typeof result.workInstructionId).toBe('string');

      expect(result.facilityId).toBeDefined();
      expect(typeof result.facilityId).toBe('string');

      expect(result.teamId).toBeDefined();
      expect(typeof result.teamId).toBe('string');

      expect(result.riskLevel).toBeDefined();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.riskLevel);

      expect(result.delayPredictionDays).toBeDefined();
      expect(typeof result.delayPredictionDays).toBe('number');

      expect(result.currentProgressRate).toBeDefined();
      expect(typeof result.currentProgressRate).toBe('number');

      expect(result.plannedProgressRate).toBeDefined();
      expect(typeof result.plannedProgressRate).toBe('number');

      expect(result.delayReason).toBeDefined();
      expect(typeof result.delayReason).toBe('string');

      expect(result.recommendedAction).toBeDefined();
      expect(typeof result.recommendedAction).toBe('string');

      expect(result.actionStatus).toBeDefined();
      expect(typeof result.actionStatus).toBe('string');

      expect(result.judgmentDateTime).toBeDefined();
      expect(typeof result.judgmentDateTime).toBe('string');
    });

    // 検証：aggregationTimestampの確認
    expect(output.aggregationTimestamp).toBeDefined();
    expect(typeof output.aggregationTimestamp).toBe('string');
    // ISO 8601形式の検証
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(output.aggregationTimestamp)).toBe(true);

    // 検証：他の出力フィールドも存在することを確認
    expect(output.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(output.progressByFacilityAndTeam)).toBe(true);

    expect(output.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(output.allocationExecutionStatus)).toBe(true);

    expect(output.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(output.handyTerminalSyncLog)).toBe(true);

    expect(output.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(output.improvementInstructionDeliveryHistory)).toBe(true);
  });
});