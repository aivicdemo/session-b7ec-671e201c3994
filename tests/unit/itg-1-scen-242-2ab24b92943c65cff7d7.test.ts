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

describe('SCEN-242: 複数拠点のダッシュボード集約', () => {
  it('facilityIdsに複数拠点が指定された場合、全拠点のデータを集約して統合ダッシュボード表示用データセットを生成する', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['F001', 'F002', 'F003'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER001',
    };

    const result: AggregateDashboardDataOutput = await aggregateDashboardData(input);

    // (1) progressByFacilityAndTeam は3拠点のすべてのチーム進捗データを含む
    expect(result.progressByFacilityAndTeam).toBeDefined();
    expect(Array.isArray(result.progressByFacilityAndTeam)).toBe(true);
    
    const uniqueFacilities = new Set(result.progressByFacilityAndTeam.map(p => p.facilityId));
    expect(uniqueFacilities.has('F001')).toBe(true);
    expect(uniqueFacilities.has('F002')).toBe(true);
    expect(uniqueFacilities.has('F003')).toBe(true);

    result.progressByFacilityAndTeam.forEach((item: ProgressByFacilityAndTeamData) => {
      expect(item.facilityId).toBeDefined();
      expect(item.facilityName).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(item.teamName).toBeDefined();
      expect(typeof item.completionRate).toBe('number');
      expect(typeof item.delayFlag).toBe('boolean');
      if (item.delayFlag) {
        expect(item.delayDays).toBeDefined();
      } else {
        expect(item.delayDays).toBeNull();
      }
      expect(typeof item.allocationEfficiency).toBe('number');
    });

    // (2) delayRiskJudgmentResults は3拠点のすべてのリスク判定結果を含む
    expect(result.delayRiskJudgmentResults).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgmentResults)).toBe(true);
    
    const riskFacilities = new Set(result.delayRiskJudgmentResults.map(r => r.facilityId));
    expect(riskFacilities.has('F001')).toBe(true);
    expect(riskFacilities.has('F002')).toBe(true);
    expect(riskFacilities.has('F003')).toBe(true);

    result.delayRiskJudgmentResults.forEach((item: DelayRiskJudgmentResultData) => {
      expect(item.riskJudgmentId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.riskLevel);
      expect(typeof item.delayPredictionDays).toBe('number');
      expect(typeof item.currentProgressRate).toBe('number');
      expect(typeof item.plannedProgressRate).toBe('number');
      expect(item.delayReason).toBeDefined();
      expect(item.recommendedAction).toBeDefined();
      expect(['未対応', '対応中', '完了']).toContain(item.actionStatus);
      expect(item.judgmentDateTime).toBeDefined();
    });

    // (3) allocationExecutionStatus は3拠点のすべての人員配置実行状況を含む
    expect(result.allocationExecutionStatus).toBeDefined();
    expect(Array.isArray(result.allocationExecutionStatus)).toBe(true);

    const allocFacilities = new Set(result.allocationExecutionStatus.map(a => a.facilityId));
    expect(allocFacilities.has('F001')).toBe(true);
    expect(allocFacilities.has('F002')).toBe(true);
    expect(allocFacilities.has('F003')).toBe(true);

    result.allocationExecutionStatus.forEach((item: AllocationExecutionStatusData) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(item.allocationPlanId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(['配置予定', '配置中', '配置完了']).toContain(item.allocationState);
      expect(typeof item.plannedWorkHours).toBe('number');
      expect(typeof item.actualWorkHours).toBe('number');
      expect(typeof item.progressRate).toBe('number');
      expect(typeof item.delayFlag).toBe('boolean');
      expect(item.plannedStartDateTime).toBeDefined();
      expect(item.plannedEndDateTime).toBeDefined();
    });

    // (4) handyTerminalSyncLog は3拠点のすべてのハンディターミナル連携ログを含む
    expect(result.handyTerminalSyncLog).toBeDefined();
    expect(Array.isArray(result.handyTerminalSyncLog)).toBe(true);

    const syncFacilities = new Set(result.handyTerminalSyncLog.map(s => s.facilityId));
    expect(syncFacilities.has('F001')).toBe(true);
    expect(syncFacilities.has('F002')).toBe(true);
    expect(syncFacilities.has('F003')).toBe(true);

    result.handyTerminalSyncLog.forEach((item: HandyTerminalSyncLogData) => {
      expect(item.syncLogId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(['作業実績', '位置情報', 'ステータス更新']).toContain(item.syncType);
      expect(['成功', '失敗', '再試行中']).toContain(item.syncStatus);
      expect(item.sendDateTime).toBeDefined();
    });

    // (5) improvementInstructionDeliveryHistory は3拠点のすべての改善指示配信履歴を含む
    expect(result.improvementInstructionDeliveryHistory).toBeDefined();
    expect(Array.isArray(result.improvementInstructionDeliveryHistory)).toBe(true);

    const deliveryFacilities = new Set(result.improvementInstructionDeliveryHistory.map(d => d.facilityId));
    expect(deliveryFacilities.has('F001')).toBe(true);
    expect(deliveryFacilities.has('F002')).toBe(true);
    expect(deliveryFacilities.has('F003')).toBe(true);

    result.improvementInstructionDeliveryHistory.forEach((item: ImprovementInstructionDeliveryHistoryData) => {
      expect(item.deliveryHistoryId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.improvementInstructionContent).toBeDefined();
      expect(item.deliveryDateTime).toBeDefined();
      expect(['配信済', '受領確認済', '実行中', '完了']).toContain(item.deliveryStatus);
      expect(typeof item.recipientCount).toBe('number');
      expect(typeof item.acknowledgedCount).toBe('number');
    });

    // (6) aggregationTimestamp は集約処理完了時点の ISO 8601 形式の日時文字列
    expect(result.aggregationTimestamp).toBeDefined();
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(timestampRegex.test(result.aggregationTimestamp)).toBe(true);

    // (7) facilityIds に指定された3拠点のデータがすべて統合されており、拠点単位での重複がない
    const progressFacilities = result.progressByFacilityAndTeam.map(p => p.facilityId);
    const riskFacilitiesList = result.delayRiskJudgmentResults.map(r => r.facilityId);
    const allocFacilitiesList = result.allocationExecutionStatus.map(a => a.facilityId);
    const syncFacilitiesList = result.handyTerminalSyncLog.map(s => s.facilityId);
    const deliveryFacilitiesList = result.improvementInstructionDeliveryHistory.map(d => d.facilityId);

    expect(new Set(progressFacilities).size).toBe(progressFacilities.length);
    expect(new Set(riskFacilitiesList).size).toBe(riskFacilitiesList.length);
    expect(new Set(allocFacilitiesList).size).toBe(allocFacilitiesList.length);
    expect(new Set(syncFacilitiesList).size).toBe(syncFacilitiesList.length);
    expect(new Set(deliveryFacilitiesList).size).toBe(deliveryFacilitiesList.length);

    // (8) teamIds が null であるため、指定拠点の全チームのデータが対象に含まれている
    expect(result.progressByFacilityAndTeam.length).toBeGreaterThan(0);
    const teamIds = new Set(result.progressByFacilityAndTeam.map(p => p.teamId));
    expect(teamIds.size).toBeGreaterThan(0);

    // (9) 集計期間内のデータのみが集約結果に含まれている
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    result.progressByFacilityAndTeam.forEach((item) => {
      // progressByFacilityAndTeam自体は日付を持たないが、ソース進捗データは期間内
    });

    result.delayRiskJudgmentResults.forEach((item) => {
      const judgmentDate = new Date(item.judgmentDateTime);
      expect(judgmentDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(judgmentDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    result.handyTerminalSyncLog.forEach((item) => {
      const sendDate = new Date(item.sendDateTime);
      expect(sendDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(sendDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    result.improvementInstructionDeliveryHistory.forEach((item) => {
      const deliveryDate = new Date(item.deliveryDateTime);
      expect(deliveryDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(deliveryDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });
});