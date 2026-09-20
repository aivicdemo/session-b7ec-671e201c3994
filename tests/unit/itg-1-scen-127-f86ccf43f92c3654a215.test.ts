import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as dataPersistence from '../../src/data/data-persistence';
import * as validation from '../../src/validation/validation-common-calculation';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

// Mock dependencies
jest.mock('../../src/data/data-persistence', () => ({
  getRecentProgressDataByWorkInstruction: jest.fn(),
  getLatestProductivityDataByWorker: jest.fn(),
  saveDelayRiskJudgment: jest.fn(),
}));

jest.mock('../../src/validation/validation-common-calculation', () => ({
  validateReferentialIntegrity: jest.fn(),
}));

jest.mock('../../src/logic/progress-monitoring-risk-engine', () => ({
  monitorAndJudgeDelayRisk: jest.requireActual('../../src/logic/progress-monitoring-risk-engine').monitorAndJudgeDelayRisk,
  calculateDelayRiskScore: jest.fn(),
  classifyDelayReason: jest.fn(),
  rankFacilitiesByRiskPriority: jest.fn(),
}));

describe('SCEN-127: 進捗遅延の要因を3分類に自動分類し、納期遅延リスク総合スコアを算出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('WMSからのリアルタイム進捗データと作業者生産性データを監視し、納期遅延リスクを判定する', async () => {
    // 1. テスト対象処理の入力データを準備
    const input = {
      facilityIds: ['FAC-001', 'FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T14:30:00Z',
      userId: 'USER-ADMIN-001',
    };

    // 2. getRecentProgressDataByWorkInstruction をスタブ化
    (dataPersistence.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue({
      'FAC-001': {
        plannedProgressRate: 85,
        actualProgressRate: 72,
        remainingWorkCount: 450,
        predictedCompletionTime: '2024-01-15T16:45:00Z',
      },
      'FAC-002': {
        plannedProgressRate: 90,
        actualProgressRate: 88,
        remainingWorkCount: 120,
        predictedCompletionTime: '2024-01-15T15:20:00Z',
      },
    });

    // 3. getLatestProductivityDataByWorker をスタブ化
    (dataPersistence.getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue({
      'FAC-001': {
        averageProductivityRate: 30,
        pastThirtyDayProductivityRate: 32,
        allocatedStaffCount: 12,
        requiredStaffCount: 15,
      },
      'FAC-002': {
        averageProductivityRate: 28,
        pastThirtyDayProductivityRate: 28,
        allocatedStaffCount: 8,
        requiredStaffCount: 8,
      },
    });

    // 4. validateReferentialIntegrity をスタブ化
    (validation.validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);

    // 5. calculateDelayRiskScore をスタブ化
    (riskEngine.calculateDelayRiskScore as jest.Mock).mockImplementation((input) => {
      if (input.facilityId === 'FAC-001') {
        return 72;
      } else if (input.facilityId === 'FAC-002') {
        return 35;
      }
      return 0;
    });

    // 6. classifyDelayReason をスタブ化
    (riskEngine.classifyDelayReason as jest.Mock).mockImplementation((input) => {
      if (input.facilityId === 'FAC-001') {
        return {
          facilityId: 'FAC-001',
          teamId: undefined,
          insufficientStaffContribution: 45,
          efficiencyDeclineContribution: 35,
          priorityMisalignmentContribution: 20,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        };
      } else if (input.facilityId === 'FAC-002') {
        return {
          facilityId: 'FAC-002',
          teamId: undefined,
          insufficientStaffContribution: 10,
          efficiencyDeclineContribution: 15,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'EFFICIENCY_DECLINE',
          responseUrgency: 'NORMAL',
        };
      }
    });

    // 7. rankFacilitiesByRiskPriority をスタブ化
    (riskEngine.rankFacilitiesByRiskPriority as jest.Mock).mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'FAC-001',
          facilityName: 'Facility 001',
          riskScore: 72,
          riskLevel: 'high',
          predictedDelayDays: 135,
          currentProgressRate: 72,
          plannedProgressRate: 85,
          priorityRank: 1,
        },
        {
          facilityId: 'FAC-002',
          facilityName: 'Facility 002',
          riskScore: 35,
          riskLevel: 'low',
          predictedDelayDays: 0,
          currentProgressRate: 88,
          plannedProgressRate: 90,
          priorityRank: 2,
        },
      ],
    });

    // 8. saveDelayRiskJudgment をスタブ化
    (dataPersistence.saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: '550e8400-e29b-41d4-a716-446655440000',
    });

    // 9. monitorAndJudgeDelayRisk を実行
    const result = await monitorAndJudgeDelayRisk(input);

    // 10. 返却された MonitorAndJudgeDelayRiskOutput のフィールドを期待値と照合

    // (1) judgmentId は UUID形式
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // (2) evaluationDateTime は入力値と同じ
    expect(result.evaluationDateTime).toBe('2024-01-15T14:30:00Z');

    // (3) rankedFacilities は2要素の配列で、リスクスコアの高い順
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBe(2);

    // FAC-001 の検証（リスク度が高い）
    const fac001Facility = result.rankedFacilities.find((f) => f.facilityId === 'FAC-001');
    expect(fac001Facility).toBeDefined();
    expect(fac001Facility?.riskScore).toBe(72);
    expect(fac001Facility?.riskLevel).toBe('high');
    expect(fac001Facility?.predictedDelayDays).toBe(135);
    expect(fac001Facility?.priorityRank).toBe(1);

    // FAC-002 の検証（リスク度が低い）
    const fac002Facility = result.rankedFacilities.find((f) => f.facilityId === 'FAC-002');
    expect(fac002Facility).toBeDefined();
    expect(fac002Facility?.riskScore).toBe(35);
    expect(fac002Facility?.riskLevel).toBe('low');
    expect(fac002Facility?.predictedDelayDays).toBe(0);
    expect(fac002Facility?.priorityRank).toBe(2);

    // rankedFacilities の優先度が降順（リスク度が高い順）
    if (result.rankedFacilities.length >= 2) {
      expect(result.rankedFacilities[0].priorityRank).toBeLessThan(result.rankedFacilities[1].priorityRank);
    }

    // (4) delayReasonClassifications は要因分類を含む
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBe(2);

    // FAC-001 の要因分類
    const fac001Classification = result.delayReasonClassifications.find((c) => c.facilityId === 'FAC-001');
    expect(fac001Classification).toBeDefined();
    expect(fac001Classification?.insufficientStaffContribution).toBe(45);
    expect(fac001Classification?.efficiencyDeclineContribution).toBe(35);
    expect(fac001Classification?.priorityMisalignmentContribution).toBe(20);
    expect(fac001Classification?.primaryDelayReason).toBe('INSUFFICIENT_STAFF');

    // FAC-002 の要因分類
    const fac002Classification = result.delayReasonClassifications.find((c) => c.facilityId === 'FAC-002');
    expect(fac002Classification).toBeDefined();
    expect(fac002Classification?.insufficientStaffContribution).toBe(10);
    expect(fac002Classification?.efficiencyDeclineContribution).toBe(15);
    expect(fac002Classification?.priorityMisalignmentContribution).toBe(10);
    expect(fac002Classification?.primaryDelayReason).toBe('EFFICIENCY_DECLINE');

    // 人員不足・効率低下・優先順位誤りの寄与度が0～100の値
    [fac001Classification, fac002Classification].forEach((classification) => {
      if (classification) {
        expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
        expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);
        expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
        expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);
        expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
        expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);
      }
    });

    // (5) recommendedAdjustments は対応拠点ごとの推奨調整
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);

    // FAC-001 の推奨調整
    const fac001Adjustments = result.recommendedAdjustments.filter((a) => a.facilityId === 'FAC-001');
    expect(fac001Adjustments.length).toBeGreaterThan(0);

    // 推奨調整の構造を検証
    fac001Adjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBe('FAC-001');
      expect(adjustment.adjustmentType).toBeDefined();
      expect(['ADD_PERSONNEL', 'CHANGE_PRIORITY', 'OPTIMIZE_PROCESS', 'EXTEND_DEADLINE']).toContain(
        adjustment.adjustmentType
      );
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adjustment.implementationPriority).toBeGreaterThan(0);
    });

    // FAC-002 の推奨調整
    const fac002Adjustments = result.recommendedAdjustments.filter((a) => a.facilityId === 'FAC-002');
    expect(fac002Adjustments.length).toBeGreaterThan(0);

    fac002Adjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBe('FAC-002');
      expect(adjustment.adjustmentType).toBeDefined();
      expect(adjustment.adjustmentDescription).toBeDefined();
    });

    // (6) hasHighRiskFacilities は高リスク拠点の存在を示す boolean
    expect(result.hasHighRiskFacilities).toBeDefined();
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // FAC-001が高リスク（riskLevel: 'high'）の場合、hasHighRiskFacilities は true
    const hasHighRiskFacility = result.rankedFacilities.some((f) => f.riskLevel === 'high');
    expect(result.hasHighRiskFacilities).toBe(hasHighRiskFacility);
    expect(result.hasHighRiskFacilities).toBe(true);

    // FAC-001の遅延度合い・人員不足度・効率低下率・優先順位乖離度が統合されて総合スコアが算出されている
    expect(fac001Classification?.insufficientStaffContribution).toBe(45);
    expect(fac001Classification?.efficiencyDeclineContribution).toBe(35);
    expect(fac001Classification?.priorityMisalignmentContribution).toBe(20);
    expect(fac001Facility?.riskScore).toBe(72);
    expect(fac001Facility?.predictedDelayDays).toBe(135);
  });
});