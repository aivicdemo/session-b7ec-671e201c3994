import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

jest.mock('../../src/data/progress-data-source', () => ({
  getRecentProgressDataByWorkInstruction: jest.fn(),
}));

jest.mock('../../src/data/productivity-data-source', () => ({
  getLatestProductivityDataByWorker: jest.fn(),
}));

jest.mock('../../src/logic/referential-integrity-validator', () => ({
  validateReferentialIntegrity: jest.fn(),
}));

jest.mock('../../src/persistence/delay-risk-judgment-repository', () => ({
  saveDelayRiskJudgment: jest.fn(),
}));

import {
  getRecentProgressDataByWorkInstruction,
} from '../../src/data/progress-data-source';
import {
  getLatestProductivityDataByWorker,
} from '../../src/data/productivity-data-source';
import {
  validateReferentialIntegrity,
} from '../../src/logic/referential-integrity-validator';
import {
  saveDelayRiskJudgment,
} from '../../src/persistence/delay-risk-judgment-repository';

describe('SCEN-1574: WMS連携の取得に失敗したとき、最後に正常に取得したデータがキャッシュから使用される', () => {
  const mockProgressData = {
    facilityId: 'F001',
    workInstructionId: 'WI001',
    currentProgress: 45,
    remainingWorkQuantity: 1000,
    plannedProgress: 60,
    productivityRate: 85,
    qualityScore: 90,
  };

  const mockProductivityData = [
    {
      workerId: 'W001',
      productivityRate: 85,
      qualityScore: 90,
    },
  ];

  const input = {
    facilityIds: ['F001'],
    teamIds: undefined,
    workInstructionIds: undefined,
    evaluationDateTime: '2024-01-15T10:30:00Z',
    userId: 'user123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期状態：getRecentProgressDataByWorkInstructionが最初の正常取得データをキャッシュに保持している状態を準備する', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue(
      mockProgressData
    );
    (getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue(
      mockProductivityData
    );
    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'J001',
    });

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThan(0);
    expect(getRecentProgressDataByWorkInstruction).toHaveBeenCalled();
  });

  test('前提条件：getLatestProductivityDataByWorkerが正常なデータを返す状態を準備し、検証する', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue(
      mockProgressData
    );
    (getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue(
      mockProductivityData
    );
    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'J001',
    });

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(getLatestProductivityDataByWorker).toHaveBeenCalled();
    const productivityCalls = (getLatestProductivityDataByWorker as jest.Mock)
      .mock.calls;
    expect(productivityCalls.length).toBeGreaterThan(0);
  });

  test('前提条件：validateReferentialIntegrityが整合性チェックを通過する状態を準備し、検証する', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue(
      mockProgressData
    );
    (getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue(
      mockProductivityData
    );
    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'J001',
    });

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(validateReferentialIntegrity).toHaveBeenCalled();
    const integrityResult = await validateReferentialIntegrity();
    expect(integrityResult).toBe(true);
  });

  test('手順：getRecentProgressDataByWorkInstructionが2回目以降の呼び出しで接続エラーを発生させる状態に遷移させ、検証する', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Network timeout'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'J001',
    });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    expect(getRecentProgressDataByWorkInstruction).toHaveBeenCalledTimes(1);

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData);

    (saveDelayRiskJudgment as jest.Mock).mockResolvedValue({
      judgmentId: 'J002',
    });

    const result2 = await monitorAndJudgeDelayRisk(input);
    expect(result2).toBeDefined();
    expect(getRecentProgressDataByWorkInstruction).toHaveBeenCalledTimes(2);
  });

  test('例外スロー確認：WMS連携の2回目呼び出しが接続エラーで失敗した場合、例外をスロー**しない**', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('503 Service Unavailable'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    let exceptionThrown = false;
    try {
      const result2 = await monitorAndJudgeDelayRisk(input);
      expect(result2).toBeDefined();
    } catch (error) {
      exceptionThrown = true;
    }
    expect(exceptionThrown).toBe(false);
  });

  test('キャッシュデータ使用確認：出力のrankedFacilitiesがキャッシュ済みデータから導出されている', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Connection timeout'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2.rankedFacilities).toBeDefined();
    expect(result2.rankedFacilities.length).toBeGreaterThan(0);

    const facility = result2.rankedFacilities.find(
      (f) => f.facilityId === 'F001'
    );
    expect(facility).toBeDefined();

    if (facility) {
      expect(facility.currentProgressRate).toBe(
        mockProgressData.currentProgress
      );
      expect(facility.plannedProgressRate).toBe(mockProgressData.plannedProgress);
      expect(facility.riskScore).toBeDefined();
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(facility.riskLevel).toBeDefined();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
      expect(facility.predictedDelayDays).toBeDefined();
      expect(typeof facility.predictedDelayDays).toBe('number');
      expect(facility.priorityRank).toBeDefined();
      expect(facility.priorityRank).toBeGreaterThanOrEqual(1);
    }
  });

  test('キャッシュデータ使用確認：delayReasonClassificationsがキャッシュされた生産性データから算出されている', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Network error'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result2.delayReasonClassifications)).toBe(true);
    expect(result2.delayReasonClassifications.length).toBeGreaterThan(0);

    const classification = result2.delayReasonClassifications.find(
      (c) => c.facilityId === 'F001'
    );
    expect(classification).toBeDefined();

    if (classification) {
      expect(classification.insufficientStaffContribution).toBeDefined();
      expect(
        typeof classification.insufficientStaffContribution
      ).toBe('number');
      expect(
        classification.insufficientStaffContribution
      ).toBeGreaterThanOrEqual(0);
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(100);

      expect(classification.efficiencyDeclineContribution).toBeDefined();
      expect(typeof classification.efficiencyDeclineContribution).toBe(
        'number'
      );
      expect(
        classification.efficiencyDeclineContribution
      ).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(100);

      expect(classification.priorityMisalignmentContribution).toBeDefined();
      expect(
        typeof classification.priorityMisalignmentContribution
      ).toBe('number');
      expect(
        classification.priorityMisalignmentContribution
      ).toBeGreaterThanOrEqual(0);
      expect(
        classification.priorityMisalignmentContribution
      ).toBeLessThanOrEqual(100);

      const totalContribution =
        classification.insufficientStaffContribution +
        classification.efficiencyDeclineContribution +
        classification.priorityMisalignmentContribution;
      expect(totalContribution).toBeLessThanOrEqual(100);

      expect(classification.primaryDelayReason).toBeDefined();
      expect([
        'INSUFFICIENT_STAFF',
        'EFFICIENCY_DECLINE',
        'PRIORITY_MISALIGNMENT',
      ]).toContain(classification.primaryDelayReason);

      expect(classification.responseUrgency).toBeDefined();
      expect(['IMMEDIATE', 'URGENT', 'NORMAL']).toContain(
        classification.responseUrgency
      );
    }
  });

  test('キャッシュデータ使用確認：recommendedAdjustmentsがキャッシュデータと矛盾せず一貫性を保っている', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Connection failed'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result2.recommendedAdjustments)).toBe(true);

    result2.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(typeof adjustment.facilityId).toBe('string');

      expect(adjustment.adjustmentType).toBeDefined();
      expect([
        'ADD_PERSONNEL',
        'CHANGE_PRIORITY',
        'OPTIMIZE_PROCESS',
        'EXTEND_DEADLINE',
      ]).toContain(adjustment.adjustmentType);

      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe('string');

      expect(adjustment.estimatedEffectiveness).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe('number');
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);

      expect(adjustment.implementationPriority).toBeDefined();
      expect(typeof adjustment.implementationPriority).toBe('number');
      expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(1);

      if (
        adjustment.adjustmentType === 'ADD_PERSONNEL' ||
        adjustment.adjustmentType === 'CHANGE_PRIORITY'
      ) {
        expect(adjustment.adjustmentDescription.length).toBeGreaterThan(0);
      }
    });
  });

  test('永続化確認：saveDelayRiskJudgmentが呼び出され、判定結果がキャッシュデータに基づくものとして記録される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Connection failed'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(saveDelayRiskJudgment).toHaveBeenCalledTimes(2);

    const secondCallArgs = (saveDelayRiskJudgment as jest.Mock).mock.calls[1];
    expect(secondCallArgs).toBeDefined();
    expect(secondCallArgs.length).toBeGreaterThan(0);

    const savedData = secondCallArgs[0];
    expect(savedData).toBeDefined();

    if (savedData.rankedFacilities) {
      expect(Array.isArray(savedData.rankedFacilities)).toBe(true);
      const savedFacility = savedData.rankedFacilities.find(
        (f: any) => f.facilityId === 'F001'
      );
      expect(savedFacility).toBeDefined();
      if (savedFacility) {
        expect(savedFacility.currentProgressRate).toBe(
          mockProgressData.currentProgress
        );
        expect(savedFacility.plannedProgressRate).toBe(
          mockProgressData.plannedProgress
        );
      }
    }

    if (savedData.delayReasonClassifications) {
      expect(Array.isArray(savedData.delayReasonClassifications)).toBe(true);
      expect(savedData.delayReasonClassifications.length).toBeGreaterThan(0);
    }

    if (savedData.recommendedAdjustments) {
      expect(Array.isArray(savedData.recommendedAdjustments)).toBe(true);
    }

    expect(result2).toBeDefined();
    expect(result2.judgmentId).toBeDefined();
  });

  test('複数エラータイプ対応：404エラーでWMS連携が失敗した場合、キャッシュから継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('404 Not Found'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2).toBeDefined();
    expect(result2.rankedFacilities).toBeDefined();
    const facility = result2.rankedFacilities.find(
      (f) => f.facilityId === 'F001'
    );
    expect(facility).toBeDefined();
    expect(facility?.currentProgressRate).toBe(mockProgressData.currentProgress);
    expect(facility?.plannedProgressRate).toBe(mockProgressData.plannedProgress);
  });

  test('複数エラータイプ対応：503エラーでWMS連携が失敗した場合、キャッシュから継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('503 Service Unavailable'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2).toBeDefined();
    expect(result2.rankedFacilities).toBeDefined();
    const facility = result2.rankedFacilities.find(
      (f) => f.facilityId === 'F001'
    );
    expect(facility).toBeDefined();
    expect(facility?.currentProgressRate).toBe(mockProgressData.currentProgress);
    expect(facility?.plannedProgressRate).toBe(mockProgressData.plannedProgress);
  });

  test('複数エラータイプ対応：タイムアウトエラーでWMS連携が失敗した場合、キャッシュから継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Connection timeout'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2).toBeDefined();
    expect(result2.rankedFacilities).toBeDefined();
    const facility = result2.rankedFacilities.find(
      (f) => f.facilityId === 'F001'
    );
    expect(facility).toBeDefined();
    expect(facility?.currentProgressRate).toBe(mockProgressData.currentProgress);
    expect(facility?.plannedProgressRate).toBe(mockProgressData.plannedProgress);
  });

  test('進捗データのみが失敗した場合でもキャッシュから継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Progress data fetch failed'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockResolvedValueOnce(mockProductivityData);

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2).toBeDefined();
    expect(result2.judgmentId).toBeDefined();
    expect(result2.rankedFacilities).toBeDefined();
    expect(result2.delayReasonClassifications).toBeDefined();
  });

  test('生産性データのみが失敗した場合でもキャッシュから継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockResolvedValueOnce(mockProgressData);

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockRejectedValueOnce(new Error('Productivity data fetch failed'));

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();

    const result2 = await monitorAndJudgeDelayRisk(input);

    expect(result2).toBeDefined();
    expect(result2.judgmentId).toBeDefined();
    expect(result2.rankedFacilities).toBeDefined();
    expect(result2.delayReasonClassifications).toBeDefined();
  });

  test('複数回の失敗後もキャッシュからの処理が継続される', async () => {
    (getRecentProgressDataByWorkInstruction as jest.Mock)
      .mockResolvedValueOnce(mockProgressData)
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'));

    (getLatestProductivityDataByWorker as jest.Mock)
      .mockResolvedValueOnce(mockProductivityData)
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'));

    (validateReferentialIntegrity as jest.Mock).mockResolvedValue(true);
    (saveDelayRiskJudgment as jest.Mock)
      .mockResolvedValueOnce({ judgmentId: 'J001' })
      .mockResolvedValueOnce({ judgmentId: 'J002' })
      .mockResolvedValueOnce({ judgmentId: 'J003' });

    const result1 = await monitorAndJudgeDelayRisk(input);
    expect(result1).toBeDefined();
    expect(result1.rankedFacilities.some((f) => f.facilityId === 'F001')).toBe(
      true
    );

    const result2 = await monitorAndJudgeDelayRisk(input);
    expect(result2).toBeDefined();
    expect(result2.rankedFacilities.some((f) => f.facilityId === 'F001')).toBe(
      true
    );

    const result3 = await monitorAndJudgeDelayRisk(input);
    expect(result3).toBeDefined();
    expect(result3.rankedFacilities.some((f) => f.facilityId === 'F001')).toBe(
      true
    );

    [result1, result2, result3].forEach((result) => {
      expect(result.judgmentId).toBeDefined();
      expect(result.rankedFacilities).toBeDefined();
      expect(result.delayReasonClassifications).toBeDefined();
      expect(result.recommendedAdjustments).toBeDefined();

      const facility = result.rankedFacilities.find(
        (f) => f.facilityId === 'F001'
      );
      expect(facility).toBeDefined();
      if (facility) {
        expect(facility.currentProgressRate).toBe(
          mockProgressData.currentProgress
        );
      }
    });
  });
});