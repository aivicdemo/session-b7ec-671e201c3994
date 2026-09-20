import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';

describe('SCEN-236: ダッシュボード表示用データセット生成', () => {
  it('複数拠点・複数チームの進捗・遅延リスク・人員配置・ハンディターミナルログ・改善指示配信履歴を集約してダッシュボード表示用データセットを生成する', async () => {
    const facilityIds = ['F001', 'F002'];
    const teamIds = ['T001', 'T002', 'T003'];
    const aggregationStartDateTime = '2024-01-15T08:00:00Z';
    const aggregationEndDateTime = '2024-01-15T18:00:00Z';
    const requestUserId = 'USER001';

    const input = {
      facilityIds,
      teamIds,
      aggregationStartDateTime,
      aggregationEndDateTime,
      requestUserId,
    };

    const result = await aggregateDashboardData(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('progressByFacilityAndTeam');
    expect(result).toHaveProperty('delayRiskJudgmentResults');
    expect(result).toHaveProperty('allocationExecutionStatus');
    expect(result).toHaveProperty('handyTerminalSyncLog');
    expect(result).toHaveProperty('improvementInstructionDeliveryHistory');
    expect(result).toHaveProperty('aggregationTimestamp');

    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);
    result.progressByFacilityAndTeam.forEach((progress) => {
      expect(progress).toHaveProperty('facilityId');
      expect(progress).toHaveProperty('facilityName');
      expect(progress).toHaveProperty('teamId');
      expect(progress).toHaveProperty('teamName');
      expect(progress).toHaveProperty('completionRate');
      expect(progress).toHaveProperty('delayFlag');
      expect(typeof progress.completionRate).toBe('number');
      expect(progress.completionRate).toBeGreaterThanOrEqual(0);
      expect(progress.completionRate).toBeLessThanOrEqual(100);
      expect(typeof progress.delayFlag).toBe('boolean');
      if (progress.delayFlag) {
        expect(typeof progress.delayDays).toBe('number');
      }
    });

    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    expect(result.delayRiskJudgmentResults.length).toBeGreaterThan(0);
    result.delayRiskJudgmentResults.forEach((risk) => {
      expect(risk).toHaveProperty('riskJudgmentId');
      expect(risk).toHaveProperty('workInstructionId');
      expect(risk).toHaveProperty('facilityId');
      expect(risk).toHaveProperty('teamId');
      expect(risk).toHaveProperty('riskLevel');
      expect(risk).toHaveProperty('delayPredictionDays');
      expect(risk).toHaveProperty('currentProgressRate');
      expect(risk).toHaveProperty('plannedProgressRate');
      expect(risk).toHaveProperty('delayReason');
      expect(risk).toHaveProperty('recommendedAction');
      expect(risk).toHaveProperty('actionStatus');
      expect(risk).toHaveProperty('judgmentDateTime');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(risk.riskLevel);
      expect(typeof risk.delayPredictionDays).toBe('number');
      expect(typeof risk.currentProgressRate).toBe('number');
      expect(typeof risk.plannedProgressRate).toBe('number');
    });

    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);
    expect(result.allocationExecutionStatus.length).toBeGreaterThan(0);
    result.allocationExecutionStatus.forEach((allocation) => {
      expect(allocation).toHaveProperty('allocationExecutionStatusId');
      expect(allocation).toHaveProperty('allocationPlanId');
      expect(allocation).toHaveProperty('workInstructionId');
      expect(allocation).toHaveProperty('workerId');
      expect(allocation).toHaveProperty('facilityId');
      expect(allocation).toHaveProperty('teamId');
      expect(allocation).toHaveProperty('allocationState');
      expect(allocation).toHaveProperty('plannedWorkHours');
      expect(allocation).toHaveProperty('actualWorkHours');
      expect(allocation).toHaveProperty('progressRate');
      expect(allocation).toHaveProperty('delayFlag');
      expect(typeof allocation.plannedWorkHours).toBe('number');
      expect(typeof allocation.actualWorkHours).toBe('number');
      expect(typeof allocation.progressRate).toBe('number');
      expect(allocation.progressRate).toBeGreaterThanOrEqual(0);
      expect(allocation.progressRate).toBeLessThanOrEqual(100);
      expect(typeof allocation.delayFlag).toBe('boolean');
    });

    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);
    expect(result.handyTerminalSyncLog.length).toBeGreaterThan(0);
    result.handyTerminalSyncLog.forEach((log) => {
      expect(log).toHaveProperty('syncLogId');
      expect(log).toHaveProperty('workerId');
      expect(log).toHaveProperty('facilityId');
      expect(log).toHaveProperty('syncType');
      expect(log).toHaveProperty('syncStatus');
      expect(log).toHaveProperty('sendDateTime');
      expect(log).toHaveProperty('receiveDateTime');
      expect(log).toHaveProperty('processingCompleteDateTime');
      expect(typeof log.sendDateTime).toBe('string');
    });

    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);
    expect(result.improvementInstructionDeliveryHistory.length).toBeGreaterThan(0);
    result.improvementInstructionDeliveryHistory.forEach((delivery) => {
      expect(delivery).toHaveProperty('deliveryHistoryId');
      expect(delivery).toHaveProperty('facilityId');
      expect(delivery).toHaveProperty('teamId');
      expect(delivery).toHaveProperty('improvementInstructionContent');
      expect(delivery).toHaveProperty('deliveryDateTime');
      expect(delivery).toHaveProperty('deliveryStatus');
      expect(delivery).toHaveProperty('recipientCount');
      expect(delivery).toHaveProperty('acknowledgedCount');
      expect(typeof delivery.deliveryDateTime).toBe('string');
      expect(typeof delivery.recipientCount).toBe('number');
      expect(typeof delivery.acknowledgedCount).toBe('number');
    });

    expect(typeof result.aggregationTimestamp).toBe('string');
    expect(() => new Date(result.aggregationTimestamp)).not.toThrow();
  });
});