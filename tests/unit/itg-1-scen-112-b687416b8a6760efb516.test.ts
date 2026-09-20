import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as logger from '../../src/utils/logger';

jest.mock('../../src/utils/logger');

describe('SCEN-112: 平均生産性が0以下のとき、警告を記録して推定値の精度低下を示す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('平均生産性が0以下の場合、警告ログを記録しながら正常に判定結果を返す', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const mockProgressData = [
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        plannedProgressRate: 50,
        actualProgressRate: 30,
        remainingWorkDays: 5,
      },
    ];

    const mockProductivityData = [
      {
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        averageWorkerProductivity: -5,
        productivityRate: 0,
        qualityScore: 80,
      },
    ];

    const mockRiskScores = [
      {
        facilityId: 'FAC001',
        riskScore: 65,
        predictedDelayDays: 3,
        currentProgressRate: 30,
        plannedProgressRate: 50,
      },
    ];

    const mockDelayReasons = [
      {
        facilityId: 'FAC001',
        insufficientStaffContribution: 45,
        efficiencyDeclineContribution: 35,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'URGENT',
      },
    ];

    const mockRankedFacilities = [
      {
        facilityId: 'FAC001',
        facilityName: 'Facility A',
        riskScore: 65,
        riskLevel: 'HIGH',
        predictedDelayDays: 3,
        currentProgressRate: 30,
        plannedProgressRate: 50,
        priorityRank: 1,
      },
    ];

    const mockRecommendedAdjustments = [
      {
        facilityId: 'FAC001',
        adjustmentType: 'ADD_PERSONNEL',
        adjustmentDescription: 'Add 2 staff members',
        estimatedEffectiveness: 70,
        implementationPriority: 1,
      },
    ];

    (logger.warn as jest.Mock).mockImplementation(() => {});

    const progressDataModule = require('../../src/logic/progress-monitoring-risk-engine');
    jest.spyOn(progressDataModule, 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
    jest.spyOn(progressDataModule, 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
    jest.spyOn(progressDataModule, 'calculateDelayRiskScore').mockResolvedValue(mockRiskScores);
    jest.spyOn(progressDataModule, 'classifyDelayReason').mockResolvedValue(mockDelayReasons);
    jest.spyOn(progressDataModule, 'rankFacilitiesByRiskPriority').mockResolvedValue(mockRankedFacilities);
    jest.spyOn(progressDataModule, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressDataModule, 'saveDelayRiskJudgment').mockResolvedValue({
      judgmentId: 'JUDGMENT001',
      recommendedAdjustments: mockRecommendedAdjustments,
    });

    const result = await monitorAndJudgeDelayRisk(input);

    // 出力値の正常性を確認（処理継続の検証）
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.rankedFacilities[0].facilityId).toBe('FAC001');
    expect(result.rankedFacilities[0].riskLevel).toBe('HIGH');
    expect(result.hasHighRiskFacilities).toBeDefined();
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
    expect(result.hasHighRiskFacilities).toBe(true);
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    expect(result.delayReasonClassifications[0].primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    expect(result.recommendedAdjustments[0].adjustmentType).toBe('ADD_PERSONNEL');

    // 警告ログが呼ばれたことを確認
    expect(logger.warn).toHaveBeenCalled();
    
    // 警告メッセージが正確に記録されたことを確認
    const warnCalls = (logger.warn as jest.Mock).mock.calls;
    const expectedWarningMessage = '生産性データが不足しています。推定値の精度が低い可能性があります';
    const hasProductivityWarning = warnCalls.some(
      (call) =>
        typeof call[0] === 'string' &&
        call[0] === expectedWarningMessage
    );
    expect(hasProductivityWarning).toBe(true);
  });

  it('平均生産性が正確に0の場合も警告を記録する', async () => {
    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER001',
    };

    const mockProgressData = [
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        plannedProgressRate: 50,
        actualProgressRate: 30,
        remainingWorkDays: 5,
      },
    ];

    const mockProductivityData = [
      {
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        averageWorkerProductivity: 0,
        productivityRate: 0,
        qualityScore: 80,
      },
    ];

    const mockRiskScores = [
      {
        facilityId: 'FAC001',
        riskScore: 70,
        predictedDelayDays: 4,
        currentProgressRate: 30,
        plannedProgressRate: 50,
      },
    ];

    const mockDelayReasons = [
      {
        facilityId: 'FAC001',
        insufficientStaffContribution: 50,
        efficiencyDeclineContribution: 30,
        priorityMisalignmentContribution: 20,
        primaryDelayReason: 'INSUFFICIENT_STAFF',
        responseUrgency: 'URGENT',
      },
    ];

    const mockRankedFacilities = [
      {
        facilityId: 'FAC001',
        facilityName: 'Facility A',
        riskScore: 70,
        riskLevel: 'HIGH',
        predictedDelayDays: 4,
        currentProgressRate: 30,
        plannedProgressRate: 50,
        priorityRank: 1,
      },
    ];

    const mockRecommendedAdjustments = [
      {
        facilityId: 'FAC001',
        adjustmentType: 'ADD_PERSONNEL',
        adjustmentDescription: 'Add 3 staff members',
        estimatedEffectiveness: 75,
        implementationPriority: 1,
      },
    ];

    (logger.warn as jest.Mock).mockImplementation(() => {});

    const progressDataModule = require('../../src/logic/progress-monitoring-risk-engine');
    jest.spyOn(progressDataModule, 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
    jest.spyOn(progressDataModule, 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
    jest.spyOn(progressDataModule, 'calculateDelayRiskScore').mockResolvedValue(mockRiskScores);
    jest.spyOn(progressDataModule, 'classifyDelayReason').mockResolvedValue(mockDelayReasons);
    jest.spyOn(progressDataModule, 'rankFacilitiesByRiskPriority').mockResolvedValue(mockRankedFacilities);
    jest.spyOn(progressDataModule, 'validateReferentialIntegrity').mockResolvedValue(true);
    jest.spyOn(progressDataModule, 'saveDelayRiskJudgment').mockResolvedValue({
      judgmentId: 'JUDGMENT002',
      recommendedAdjustments: mockRecommendedAdjustments,
    });

    const result = await monitorAndJudgeDelayRisk(input);

    // 出力値の正常性を確認（処理継続の検証）
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.evaluationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(result.rankedFacilities[0].facilityId).toBe('FAC001');
    expect(result.rankedFacilities[0].riskLevel).toBe('HIGH');
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBeGreaterThan(0);
    expect(result.delayReasonClassifications[0].primaryDelayReason).toBe('INSUFFICIENT_STAFF');
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThan(0);
    expect(result.recommendedAdjustments[0].adjustmentType).toBe('ADD_PERSONNEL');
    expect(result.hasHighRiskFacilities).toBeDefined();
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');
    expect(result.hasHighRiskFacilities).toBe(true);

    // 警告ログが呼ばれたことを確認
    expect(logger.warn).toHaveBeenCalled();
    
    // 警告メッセージが正確に記録されたことを確認
    const warnCalls = (logger.warn as jest.Mock).mock.calls;
    const expectedWarningMessage = '生産性データが不足しています。推定値の精度が低い可能性があります';
    const hasProductivityWarning = warnCalls.some(
      (call) =>
        typeof call[0] === 'string' &&
        call[0] === expectedWarningMessage
    );
    expect(hasProductivityWarning).toBe(true);
  });
});