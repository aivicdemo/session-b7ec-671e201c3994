import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-257: ダッシュボード統合データセット生成', () => {
  test('人員配置実行状況を指定条件で取得し、AllocationExecutionStatusDataに変換して出力に含める', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001', 'TEAM002'],
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result = await aggregateDashboardData(input);

    // AggregateDashboardDataOutput が返されることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    // allocationExecutionStatus フィールドが存在し、配列であることを確認
    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);

    // 各 AllocationExecutionStatusData オブジェクトが全フィールドを含むことを確認
    result.allocationExecutionStatus.forEach((item) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(typeof item.allocationExecutionStatusId).toBe('string');

      expect(item.allocationPlanId).toBeDefined();
      expect(typeof item.allocationPlanId).toBe('string');

      expect(item.workInstructionId).toBeDefined();
      expect(typeof item.workInstructionId).toBe('string');

      expect(item.workerId).toBeDefined();
      expect(typeof item.workerId).toBe('string');

      expect(item.facilityId).toBeDefined();
      expect(typeof item.facilityId).toBe('string');

      expect(item.teamId).toBeDefined();
      expect(typeof item.teamId).toBe('string');

      expect(item.allocationState).toBeDefined();
      expect(typeof item.allocationState).toBe('string');

      expect(item.plannedWorkHours).toBeDefined();
      expect(typeof item.plannedWorkHours).toBe('number');

      expect(item.actualWorkHours).toBeDefined();
      expect(typeof item.actualWorkHours).toBe('number');

      expect(item.progressRate).toBeDefined();
      expect(typeof item.progressRate).toBe('number');

      expect(item.delayFlag).toBeDefined();
      expect(typeof item.delayFlag).toBe('boolean');

      expect(item.plannedStartDateTime).toBeDefined();
      expect(typeof item.plannedStartDateTime).toBe('string');

      expect(item.plannedEndDateTime).toBeDefined();
      expect(typeof item.plannedEndDateTime).toBe('string');

      // actualStartDateTime は string | null
      expect(item.actualStartDateTime === null || typeof item.actualStartDateTime === 'string').toBe(true);

      // actualEndDateTime は string | null
      expect(item.actualEndDateTime === null || typeof item.actualEndDateTime === 'string').toBe(true);
    });

    // progressByFacilityAndTeam フィールドが存在し、配列であることを確認
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);

    // delayRiskJudgmentResults フィールドが存在し、配列であることを確認
    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);

    // handyTerminalSyncLog フィールドが存在し、配列であることを確認
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    // improvementInstructionDeliveryHistory フィールドが存在し、配列であることを確認
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    // aggregationTimestamp が ISO 8601 形式の有効な日時文字列として存在することを確認
    expect(result.aggregationTimestamp).toBeDefined();
    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(result.aggregationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // ISO 8601 形式の文字列が有効な日時として解析できることを確認
    const timestamp = new Date(result.aggregationTimestamp);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });
});