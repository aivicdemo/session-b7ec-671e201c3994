import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as dataPersistence from '../../src/data/data-persistence';
import * as validationCommonCalculation from '../../src/validation/validation-common-calculation';
import * as progressMonitoringRiskEngine from '../../src/logic/progress-monitoring-risk-engine';

jest.mock('../../src/data/data-persistence');
jest.mock('../../src/validation/validation-common-calculation');
jest.mock('../../src/logic/progress-monitoring-risk-engine', {
  ...jest.requireActual('../../src/logic/progress-monitoring-risk-engine'),
  calculateDelayRiskScore: jest.fn(),
  classifyDelayReason: jest.fn(),
  rankFacilitiesByRiskPriority: jest.fn(),
});

describe('SCEN-1573: WMS連携により現在の作業進捗が拠点・チーム・作業指示単位で取得される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // スタブ: getRecentProgressDataByWorkInstruction
    (dataPersistence.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue({
      'WI-001': {
        workInstructionId: 'WI-001',
        facilityId: 'F001',
        teamId: 'T001',
        completedCount: 450,
        remainingCount: 150,
        progressRate: 75,
      },
      'WI-002': {
        workInstructionId: 'WI-002',
        facilityId: 'F002',
        teamId: 'T001',
        completedCount: 300,
        remainingCount: 200,
        progressRate: 60,
      },
    });

    // スタブ: getLatestProductivityDataByWorker
    (dataPersistence.getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue([
      {
        workerId: 'W001',
        hoursPerProcessCount: 5,
        qualityScore: 95,
        proficiencyLevel: 4,
      },
      {
        workerId: 'W002',
        hoursPerProcessCount: 4,
        qualityScore: 90,
        proficiencyLevel: 3,
      },
    ]);

    // スタブ: validateReferentialIntegrity
    (validationCommonCalculation.validateReferentialIntegrity as jest.Mock).mockResolvedValue({
      isValid: true,
      inconsistencies: [],
    });

    // スタブ: calculateDelayRiskScore
    (progressMonitoringRiskEngine.calculateDelayRiskScore as jest.Mock).mockResolvedValue({
      F001: { riskScore: 35, riskLevel: 'MEDIUM' },
      F002: { riskScore: 60, riskLevel: 'HIGH' },
    });

    // スタブ: classifyDelayReason
    (progressMonitoringRiskEngine.classifyDelayReason as jest.Mock).mockResolvedValue([
      {
        facilityId: 'F001',
        teamId: 'T001',
        insufficientStaffContribution: 30,
        efficiencyDeclineContribution: 40,
        priorityMisalignmentContribution: 30,
        primaryDelayReason: 'EFFICIENCY_DECLINE',
        responseUrgency: 'URGENT',
      },
      {
        facilityId: 'F002',
        teamId: 'T001',
        insufficientStaffContribution: 50,
        efficiencyDeclineContribution: 25,
        priorityMisalignmentContribution: 25,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'IMMEDIATE',
      },
    ]);

    // スタブ: rankFacilitiesByRiskPriority
    (progressMonitoringRiskEngine.rankFacilitiesByRiskPriority as jest.Mock).mockResolvedValue({
      rankedFacilities: [
        {
          facilityId: 'F002',
          facilityName: 'Facility 2',
          riskScore: 60,
          riskLevel: 'HIGH',
          predictedDelayDays: 3,
          currentProgressRate: 60,
          plannedProgressRate: 75,
          priorityRank: 1,
        },
        {
          facilityId: 'F001',
          facilityName: 'Facility 1',
          riskScore: 35,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 75,
          plannedProgressRate: 80,
          priorityRank: 2,
        },
      ],
    });
  });

  it('should retrieve and analyze progress data from WMS for specified facilities, teams, and work instructions', async () => {
    // Arrange: Input構築
    const input = {
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001'],
      workInstructionIds: ['WI-001', 'WI-002'],
      evaluationDateTime: '2025-01-15T14:30:00Z',
      userId: 'user-123',
    };

    // Act: 関数実行
    const output = await monitorAndJudgeDelayRisk(input);

    // Assert: 出力の基本構造を検証
    expect(output).toBeDefined();
    expect(output.judgmentId).toBeDefined();
    expect(typeof output.judgmentId).toBe('string');
    expect(output.judgmentId.length).toBeGreaterThan(0);

    // evaluationDateTime が入力値と完全に一致していること
    expect(output.evaluationDateTime).toBe('2025-01-15T14:30:00Z');

    // rankedFacilities の検証
    expect(output.rankedFacilities).toBeDefined();
    expect(Array.isArray(output.rankedFacilities)).toBe(true);
    expect(output.rankedFacilities.length).toBeGreaterThan(0);

    // rankedFacilities に拠点情報が含まれていること
    output.rankedFacilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(facility.facilityName).toBeDefined();
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(facility.riskLevel).toMatch(/^(HIGH|MEDIUM|LOW)$/);
      expect(facility.predictedDelayDays).toBeDefined();
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(facility.currentProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.currentProgressRate).toBeLessThanOrEqual(100);
      expect(facility.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(facility.plannedProgressRate).toBeLessThanOrEqual(100);
      expect(facility.priorityRank).toBeGreaterThanOrEqual(1);
      expect(typeof facility.priorityRank).toBe('number');
    });

    // 拠点 F001 と F002 が含まれていることを確認
    const facilityIds = output.rankedFacilities.map(f => f.facilityId);
    expect(facilityIds).toContain('F001');
    expect(facilityIds).toContain('F002');

    // WI-001 の進捗率75%と WI-002 の進捗率60%が反映されていることを確認
    const f001 = output.rankedFacilities.find(f => f.facilityId === 'F001');
    const f002 = output.rankedFacilities.find(f => f.facilityId === 'F002');
    expect(f001).toBeDefined();
    expect(f002).toBeDefined();

    // F001 は WI-001（進捗率75%）に対応し、F002 は WI-002（進捗率60%）に対応
    expect(f001!.currentProgressRate).toBe(75);
    expect(f002!.currentProgressRate).toBe(60);

    // delayReasonClassifications の検証
    expect(output.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(output.delayReasonClassifications)).toBe(true);
    expect(output.delayReasonClassifications.length).toBeGreaterThan(0);

    output.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(['F001', 'F002']).toContain(classification.facilityId);

      // 人員不足・効率低下・優先順位誤りの3分類による寄与度を検証
      expect(classification.insufficientStaffContribution).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe('number');
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(0);
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);

      expect(classification.efficiencyDeclineContribution).toBeDefined();
      expect(typeof classification.efficiencyDeclineContribution).toBe('number');
      expect(classification.efficiencyDeclineContribution).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);

      expect(classification.priorityMisalignmentContribution).toBeDefined();
      expect(typeof classification.priorityMisalignmentContribution).toBe('number');
      expect(classification.priorityMisalignmentContribution).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(100);

      expect(classification.primaryDelayReason).toBeDefined();
      expect(classification.primaryDelayReason).toMatch(
        /^(INSUFFICIENT_STAFF|EFFICIENCY_DECLINE|PRIORITY_MISALIGNMENT)$/
      );

      expect(classification.responseUrgency).toBeDefined();
      expect(classification.responseUrgency).toMatch(/^(IMMEDIATE|URGENT|NORMAL)$/);
    });

    // 拠点 F001 と F002 の分類情報が含まれていることを確認
    const classificationFacilityIds = output.delayReasonClassifications.map(c => c.facilityId);
    expect(classificationFacilityIds).toContain('F001');
    expect(classificationFacilityIds).toContain('F002');

    // F002 が INSUFFICIENT_STAFF で緊急度 IMMEDIATE であることを確認
    const f002Classification = output.delayReasonClassifications.find(c => c.facilityId === 'F002');
    expect(f002Classification?.primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(f002Classification?.responseUrgency).toBe('IMMEDIATE');
    expect(f002Classification?.insufficientStaffContribution).toBe(50);

    // F001 が EFFICIENCY_DECLINE で緊急度 URGENT であることを確認
    const f001Classification = output.delayReasonClassifications.find(c => c.facilityId === 'F001');
    expect(f001Classification?.primaryDelayReason).toBe('EFFICIENCY_DECLINE');
    expect(f001Classification?.responseUrgency).toBe('URGENT');
    expect(f001Classification?.efficiencyDeclineContribution).toBe(40);

    // recommendedAdjustments の検証
    expect(output.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(output.recommendedAdjustments)).toBe(true);
    expect(output.recommendedAdjustments.length).toBeGreaterThan(0);

    output.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(['F001', 'F002']).toContain(adjustment.facilityId);

      expect(adjustment.adjustmentType).toBeDefined();
      expect(adjustment.adjustmentType).toMatch(
        /^(ADD_PERSONNEL|CHANGE_PRIORITY|OPTIMIZE_PROCESS|EXTEND_DEADLINE)$/
      );

      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');
      expect(adjustment.adjustmentDescription.length).toBeGreaterThan(0);

      expect(adjustment.estimatedEffectiveness).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);

      expect(adjustment.implementationPriority).toBeDefined();
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(1);
    });

    // 対応が必要な拠点ごとの推奨調整内容が含まれていることを確認
    const adjustmentFacilityIds = output.recommendedAdjustments.map(a => a.facilityId);
    expect(adjustmentFacilityIds.length).toBeGreaterThan(0);

    // hasHighRiskFacilities の検証
    expect(output.hasHighRiskFacilities).toBeDefined();
    expect(typeof output.hasHighRiskFacilities).toBe('boolean');

    // F002 が HIGH リスクレベルであるため、hasHighRiskFacilities は true であること
    const highRiskFacility = output.rankedFacilities.find(f => f.riskLevel === 'HIGH');
    if (highRiskFacility) {
      expect(output.hasHighRiskFacilities).toBe(true);
    }

    // ランク付けが優先度順になっていることを確認
    for (let i = 1; i < output.rankedFacilities.length; i++) {
      expect(output.rankedFacilities[i - 1].priorityRank).toBeLessThanOrEqual(
        output.rankedFacilities[i].priorityRank
      );
    }

    // 作業指示単位で取得されたデータがスタブから正しく参照されたことを確認
    expect(dataPersistence.getRecentProgressDataByWorkInstruction).toHaveBeenCalled();
    expect(dataPersistence.getLatestProductivityDataByWorker).toHaveBeenCalled();
    expect(validationCommonCalculation.validateReferentialIntegrity).toHaveBeenCalled();
  });
});