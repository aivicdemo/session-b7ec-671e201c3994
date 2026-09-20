import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as riskEngine from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1567: 進捗遅延リスク判定エンジンの出力が空または不正な形式の場合のエラーハンドリング', () => {
  const input = {
    facilityIds: ['F001'],
    teamIds: undefined,
    workInstructionIds: undefined,
    evaluationDateTime: '2025-01-15T10:00:00Z',
    userId: 'USER001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('出力が null の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue(null as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力が undefined の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue(undefined as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力が空オブジェクト {} の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({} as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の judgmentId が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      rankedFacilities: [],
      evaluationDateTime: '2025-01-15T10:00:00Z',
      delayReasonClassifications: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の evaluationDateTime が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      rankedFacilities: [],
      delayReasonClassifications: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の rankedFacilities が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      delayReasonClassifications: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の delayReasonClassifications が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の recommendedAdjustments が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      delayReasonClassifications: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の hasHighRiskFacilities が欠落している場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      delayReasonClassifications: [],
      recommendedAdjustments: [],
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の rankedFacilities が不正な型（文字列）の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: 'invalid' as any,
      delayReasonClassifications: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の delayReasonClassifications が不正な型（数値）の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      delayReasonClassifications: 123 as any,
      recommendedAdjustments: [],
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の recommendedAdjustments が不正な型（文字列）の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      delayReasonClassifications: [],
      recommendedAdjustments: 'invalid' as any,
      hasHighRiskFacilities: false,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });

  it('出力の hasHighRiskFacilities が不正な型（文字列）の場合、エラーメッセージがスローされる', async () => {
    jest.spyOn(riskEngine, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 75,
      predictedDelayDays: 3,
    } as any);
    jest.spyOn(riskEngine, 'classifyDelayReason').mockResolvedValue({
      facilityId: 'F001',
      insufficientStaffContribution: 50,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 20,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'URGENT',
    } as any);
    jest.spyOn(riskEngine, 'rankFacilitiesByRiskPriority').mockResolvedValue({
      judgmentId: 'J001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [],
      delayReasonClassifications: [],
      recommendedAdjustments: [],
      hasHighRiskFacilities: 'invalid' as any,
    } as any);

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗分析データが不足しています。再度分析を実行してください'
    );
  });
});