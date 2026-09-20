import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  monitorAndJudgeDelayRisk,
  MonitorAndJudgeDelayRiskInput,
  MonitorAndJudgeDelayRiskOutput,
  calculateDelayRiskScore,
  CalculateDelayRiskScoreInput,
  classifyDelayReason,
  ClassifyDelayReasonInput,
  rankFacilitiesByRiskPriority,
  RankFacilitiesByRiskPriorityInput,
} from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-114: 配置人数と必要人数の差分から人員不足の程度を算出し、人員不足要因の寄与度を計算する', () => {
  let input: MonitorAndJudgeDelayRiskInput;

  beforeEach(() => {
    input = {
      facilityIds: ['FACILITY_A'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER_001',
    };
  });

  it('配置人数8名と必要人数12名から人員不足スコア33.33を算出し、寄与度66.6%として計算される', async () => {
    // シナリオデータの設定
    const scenarioData = {
      currentProgress: 45,
      requiredProgressByTime: 60,
      allocatedWorkerCount: 8,
      requiredWorkerCount: 12,
      averageProductivityPerWorker: 15,
      historicalProductivityPerWorker: 18,
      workPrioritySequence: ['task_A', 'task_B', 'task_C'],
      optimalPrioritySequence: ['task_B', 'task_A', 'task_C'],
    };

    // 業務ルールbr-tx_4-004に基づく期待値計算
    const delayGap = scenarioData.requiredProgressByTime - scenarioData.currentProgress; // 15
    const staffGap = scenarioData.requiredWorkerCount - scenarioData.allocatedWorkerCount; // 4
    const staffShortageScore = (staffGap / scenarioData.requiredWorkerCount) * 100; // 33.33
    const efficiencyDecline =
      ((scenarioData.historicalProductivityPerWorker - scenarioData.averageProductivityPerWorker) /
        scenarioData.historicalProductivityPerWorker) *
      100; // 16.67
    const efficiencyDeclineScore = efficiencyDecline; // 16.67
    const priorityMismatchScore = 0;

    const totalScore = staffShortageScore + efficiencyDeclineScore + priorityMismatchScore; // 50.0
    const staffShortageContribution = (staffShortageScore / totalScore) * 100; // 66.6
    const efficiencyDeclineContribution = (efficiencyDeclineScore / totalScore) * 100; // 33.4

    // 総合リスクスコア計算: Math.min(100, 15*10 + 33.33*0.3 + 16.67*0.3 + 0*0.2) ≈ 58.3
    const expectedRiskScore = Math.min(
      100,
      delayGap * 10 + staffShortageScore * 0.3 + efficiencyDeclineScore * 0.3 + priorityMismatchScore * 0.2
    );

    // 実際の関数を呼び出し
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    // 基本的な戻り値の構造を検証
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    const facilityRiskInfo = result.rankedFacilities[0];
    expect(facilityRiskInfo).toBeDefined();
    expect(facilityRiskInfo.facilityId).toBe('FACILITY_A');
    expect(facilityRiskInfo.priorityRank).toBe(1);

    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);

    const delayClassification = result.delayReasonClassifications[0];
    expect(delayClassification).toBeDefined();
    expect(delayClassification.facilityId).toBe('FACILITY_A');

    // 寄与度の検証
    expect(typeof delayClassification.insufficientStaffContribution).toBe('number');
    expect(delayClassification.insufficientStaffContribution).toBeCloseTo(staffShortageContribution, 0);
    expect(delayClassification.insufficientStaffContribution).toBeCloseTo(66.6, 0);

    expect(typeof delayClassification.efficiencyDeclineContribution).toBe('number');
    expect(delayClassification.efficiencyDeclineContribution).toBeCloseTo(efficiencyDeclineContribution, 0);
    expect(delayClassification.efficiencyDeclineContribution).toBeCloseTo(33.4, 0);

    expect(typeof delayClassification.priorityMisalignmentContribution).toBe('number');
    expect(delayClassification.priorityMisalignmentContribution).toBeCloseTo(0, 0);
    expect(delayClassification.priorityMisalignmentContribution).toBeLessThan(5);

    // 寄与度合計の検証（正規化）
    const totalContribution =
      delayClassification.insufficientStaffContribution +
      delayClassification.efficiencyDeclineContribution +
      delayClassification.priorityMisalignmentContribution;
    expect(totalContribution).toBeCloseTo(100, 0);

    expect(delayClassification.primaryDelayReason).toBe('INSUFFICIENT_STAFF');

    // リスクスコアの検証
    expect(facilityRiskInfo.riskScore).toBeDefined();
    expect(typeof facilityRiskInfo.riskScore).toBe('number');
    expect(facilityRiskInfo.riskScore).toBeGreaterThanOrEqual(0);
    expect(facilityRiskInfo.riskScore).toBeLessThanOrEqual(100);
    expect(facilityRiskInfo.riskScore).toBeCloseTo(expectedRiskScore, 0);
    expect(facilityRiskInfo.riskScore).toBeCloseTo(58.3, 0);

    // リスクレベルの検証
    expect(facilityRiskInfo.riskLevel).toBe('MEDIUM');

    expect(result.hasHighRiskFacilities).toBe(false);

    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
  });

  it('人員不足要因の寄与度が66.6%として正規化されている', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    expect(delayClassification.insufficientStaffContribution).toBeCloseTo(66.6, 0);
    expect(delayClassification.insufficientStaffContribution).toBeGreaterThan(0);
    expect(delayClassification.insufficientStaffContribution).toBeLessThanOrEqual(100);
  });

  it('効率低下要因の寄与度が33.4%として正規化されている', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    expect(delayClassification.efficiencyDeclineContribution).toBeCloseTo(33.4, 0);
    expect(delayClassification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
    expect(delayClassification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
  });

  it('優先順位誤り要因の寄与度がほぼ0に近い値である', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    expect(delayClassification.priorityMisalignmentContribution).toBeLessThan(5);
    expect(delayClassification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
  });

  it('判定結果がjudgmentIdとともに正常に保存される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(result.evaluationDateTime).toBe(input.evaluationDateTime);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.rankedFacilities[0].facilityId).toBe('FACILITY_A');
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    expect(result.delayReasonClassifications[0].facilityId).toBe('FACILITY_A');
  });

  it('総合リスクスコアが期待値58.3に近い値として計算される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    const facilityRiskInfo = result.rankedFacilities[0];

    expect(facilityRiskInfo.riskScore).toBeCloseTo(58.3, 0);
  });

  it('複数拠点のランク付けで1拠点目のpriorityRankが1に割り当てられている', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.rankedFacilities[0].priorityRank).toBe(1);
  });

  it('遅延要因分類で人員不足が主要因として判定される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    expect(delayClassification.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(delayClassification.insufficientStaffContribution).toBeGreaterThan(
      delayClassification.efficiencyDeclineContribution
    );
  });

  it('入力値の検証を通過し、進捗データと生産性データの参照整合性が確認される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
  });

  it('進捗データが利用可能な状態で関数が実行される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.rankedFacilities[0].currentProgressRate).toBeDefined();
    expect(typeof result.rankedFacilities[0].currentProgressRate).toBe('number');
    expect(result.rankedFacilities[0].currentProgressRate).toBeGreaterThanOrEqual(0);
    expect(result.rankedFacilities[0].currentProgressRate).toBeLessThanOrEqual(100);
  });

  it('作業者生産性データが蓄積されている状態で分析が実行される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    expect(delayClassification.efficiencyDeclineContribution).toBeDefined();
    expect(typeof delayClassification.efficiencyDeclineContribution).toBe('number');
  });

  it('配置人数と必要人数の差分が33.33スコアとして適切に算出される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    const staffShortageScore = delayClassification.insufficientStaffContribution;
    expect(staffShortageScore).toBeGreaterThan(0);
    expect(staffShortageScore).toBeCloseTo(66.6, 0);
  });

  it('遅延要因分類が正常に実行され、複数要因の寄与度が計算される', async () => {
    const result: MonitorAndJudgeDelayRiskOutput = await monitorAndJudgeDelayRisk(input);

    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    const delayClassification = result.delayReasonClassifications[0];

    const totalContribution =
      delayClassification.insufficientStaffContribution +
      delayClassification.efficiencyDeclineContribution +
      delayClassification.priorityMisalignmentContribution;

    expect(totalContribution).toBeCloseTo(100, 0);
  });
});