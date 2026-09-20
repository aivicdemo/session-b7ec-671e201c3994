import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import type {
  AggregateDashboardDataInput,
  AggregateDashboardDataOutput,
  ProgressByFacilityAndTeamData,
  DelayRiskJudgmentResultData,
  AllocationExecutionStatusData,
  HandyTerminalSyncLogData,
  ImprovementInstructionDeliveryHistoryData,
} from '../../src/logic/dashboard-aggregation';

describe('aggregateDashboardData - SCEN-263', () => {
  it('出力：progressByFacilityAndTeamに拠点別・チーム別の進捗状況配列が含まれる', async () => {
    // Arrange: 入力値の準備
    const input: AggregateDashboardDataInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-15T09:00:00Z',
      aggregationEndDateTime: '2024-01-15T18:00:00Z',
      requestUserId: 'USER-ADMIN-001',
    };

    // モック進捗データの準備
    const mockProgressData: ProgressByFacilityAndTeamData[] = [
      {
        facilityId: 'FAC001',
        facilityName: 'Factory A',
        teamId: 'TEAM-A',
        teamName: 'Team A',
        completionRate: 85,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 95,
      },
      {
        facilityId: 'FAC001',
        facilityName: 'Factory A',
        teamId: 'TEAM-B',
        teamName: 'Team B',
        completionRate: 72,
        delayFlag: true,
        delayDays: 2,
        allocationEfficiency: 88,
      },
      {
        facilityId: 'FAC002',
        facilityName: 'Factory B',
        teamId: 'TEAM-C',
        teamName: 'Team C',
        completionRate: 91,
        delayFlag: false,
        delayDays: null,
        allocationEfficiency: 97,
      },
      {
        facilityId: 'FAC002',
        facilityName: 'Factory B',
        teamId: 'TEAM-D',
        teamName: 'Team D',
        completionRate: 65,
        delayFlag: true,
        delayDays: 3,
        allocationEfficiency: 82,
      },
    ];

    // モック遅延リスク判定結果
    const mockDelayRiskResults: DelayRiskJudgmentResultData[] = [
      {
        riskJudgmentId: 'RISK-001',
        workInstructionId: 'WI-001',
        facilityId: 'FAC001',
        teamId: 'TEAM-B',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 2,
        currentProgressRate: 72,
        plannedProgressRate: 85,
        delayReason: '人員不足',
        recommendedAction: '人員追加',
        actionStatus: '未対応',
        judgmentDateTime: '2024-01-15T12:00:00Z',
      },
      {
        riskJudgmentId: 'RISK-002',
        workInstructionId: 'WI-002',
        facilityId: 'FAC002',
        teamId: 'TEAM-D',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        currentProgressRate: 65,
        plannedProgressRate: 80,
        delayReason: '効率低下',
        recommendedAction: '優先順位変更',
        actionStatus: '対応中',
        judgmentDateTime: '2024-01-15T14:00:00Z',
      },
    ];

    // モック人員配置実行状況
    const mockAllocationStatus: AllocationExecutionStatusData[] = [
      {
        allocationExecutionStatusId: 'AES-001',
        allocationPlanId: 'AP-001',
        workInstructionId: 'WI-001',
        workerId: 'WORKER-001',
        facilityId: 'FAC001',
        teamId: 'TEAM-A',
        allocationState: '配置中',
        plannedWorkHours: 8,
        actualWorkHours: 7.5,
        progressRate: 85,
        delayFlag: false,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        actualStartDateTime: '2024-01-15T09:00:00Z',
        actualEndDateTime: null,
      },
    ];

    // モックハンディターミナル連携ログ
    const mockSyncLog: HandyTerminalSyncLogData[] = [
      {
        syncLogId: 'SYNC-001',
        workerId: 'WORKER-001',
        facilityId: 'FAC001',
        syncType: '作業実績',
        syncStatus: '成功',
        errorMessage: null,
        sendDateTime: '2024-01-15T12:30:00Z',
        receiveDateTime: '2024-01-15T12:31:00Z',
        processingCompleteDateTime: '2024-01-15T12:32:00Z',
      },
    ];

    // モック改善指示配信履歴
    const mockDeliveryHistory: ImprovementInstructionDeliveryHistoryData[] = [
      {
        deliveryHistoryId: 'DH-001',
        facilityId: 'FAC001',
        teamId: 'TEAM-B',
        improvementInstructionContent: '人員追加',
        deliveryDateTime: '2024-01-15T13:00:00Z',
        deliveryStatus: '配信済',
        recipientCount: 5,
        acknowledgedCount: 3,
      },
    ];

    // Act: aggregateDashboardDataを呼び出す
    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // Assert: 出力値の検証
    expect(result).toBeDefined();
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThanOrEqual(4);

    // progressByFacilityAndTeam配列の各要素を検証
    const progress = result.progressByFacilityAndTeam;

    // 最初の要素: FAC001-TEAM-A
    expect(progress[0]).toHaveProperty('facilityId', 'FAC001');
    expect(progress[0]).toHaveProperty('teamId', 'TEAM-A');
    expect(progress[0]).toHaveProperty('completionRate', 85);
    expect(progress[0]).toHaveProperty('delayFlag', false);
    expect(progress[0]).toHaveProperty('delayDays', null);

    // 2番目の要素: FAC001-TEAM-B
    expect(progress[1]).toHaveProperty('facilityId', 'FAC001');
    expect(progress[1]).toHaveProperty('teamId', 'TEAM-B');
    expect(progress[1]).toHaveProperty('completionRate', 72);
    expect(progress[1]).toHaveProperty('delayFlag', true);
    expect(progress[1]).toHaveProperty('delayDays', 2);

    // 3番目の要素: FAC002-TEAM-C
    expect(progress[2]).toHaveProperty('facilityId', 'FAC002');
    expect(progress[2]).toHaveProperty('teamId', 'TEAM-C');
    expect(progress[2]).toHaveProperty('completionRate', 91);
    expect(progress[2]).toHaveProperty('delayFlag', false);
    expect(progress[2]).toHaveProperty('delayDays', null);

    // 4番目の要素: FAC002-TEAM-D
    expect(progress[3]).toHaveProperty('facilityId', 'FAC002');
    expect(progress[3]).toHaveProperty('teamId', 'TEAM-D');
    expect(progress[3]).toHaveProperty('completionRate', 65);
    expect(progress[3]).toHaveProperty('delayFlag', true);
    expect(progress[3]).toHaveProperty('delayDays', 3);

    // aggregationTimestampの検証
    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(result.aggregationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // その他の出力フィールドの検証
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
  });
});