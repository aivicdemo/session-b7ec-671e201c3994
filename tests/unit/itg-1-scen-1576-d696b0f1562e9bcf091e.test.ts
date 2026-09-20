import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

// Mock external dependencies
jest.mock('../../src/adapters/risk-prediction-ai-adapter');
jest.mock('../../src/adapters/data-persistence');

import { RiskPredictionAiAdapter } from '../../src/adapters/risk-prediction-ai-adapter';
import { DataPersistence } from '../../src/adapters/data-persistence';

describe('進捗遅延リスク常時監視 - SageMaker連携失敗時のキャッシュ動作', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SageMaker推論に失敗したとき、前回の正常な判定結果がキャッシュから使用される', async () => {
    // ステップ1: テスト入力データの準備
    const testInput = {
      facilityIds: ['F001', 'F002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:00:00Z',
      userId: 'user-001',
    };

    // ステップ2: 前回の正常な判定結果をキャッシュに格納
    const cachedJudgmentResult = {
      judgmentId: 'cached-judgment-001',
      evaluationDateTime: '2025-01-15T10:00:00Z',
      rankedFacilities: [
        {
          facilityId: 'F001',
          facilityName: 'Facility 001',
          riskScore: 75,
          riskLevel: 'HIGH',
          predictedDelayDays: 3,
          currentProgressRate: 45,
          plannedProgressRate: 70,
          priorityRank: 1,
        },
        {
          facilityId: 'F002',
          facilityName: 'Facility 002',
          riskScore: 45,
          riskLevel: 'MEDIUM',
          predictedDelayDays: 1,
          currentProgressRate: 65,
          plannedProgressRate: 75,
          priorityRank: 2,
        },
      ],
      delayReasonClassifications: [
        {
          facilityId: 'F001',
          teamId: undefined,
          insufficientStaffContribution: 60,
          efficiencyDeclineContribution: 30,
          priorityMisalignmentContribution: 10,
          primaryDelayReason: 'INSUFFICIENT_STAFF',
          responseUrgency: 'IMMEDIATE',
        },
      ],
      recommendedAdjustments: [
        {
          facilityId: 'F001',
          adjustmentType: 'ADD_PERSONNEL',
          adjustmentDescription: '他拠点から2名の人員融通',
          estimatedEffectiveness: 70,
          implementationPriority: 1,
        },
      ],
      hasHighRiskFacilities: true,
    };

    // ステップ3: RiskPredictionAiAdapterの推論失敗をシミュレート
    (RiskPredictionAiAdapter.predictDelayRisk as jest.Mock).mockRejectedValueOnce(
      new Error('Service Unavailable: SageMaker推論サービスが一時停止中')
    );

    // ステップ4: DataPersistenceがキャッシュ結果を返すようシミュレート
    (DataPersistence.getRecentDelayRiskJudgmentByFacilityAndTeam as jest.Mock).mockResolvedValueOnce(
      cachedJudgmentResult
    );

    // ステップ5: monitorAndJudgeDelayRiskを呼び出す
    const result = await monitorAndJudgeDelayRisk(testInput);

    // ステップ6: 戻り値を検証
    // 期待結果（1）: judgmentIdがキャッシュ結果のIDである
    expect(result.judgmentId).toBe('cached-judgment-001');

    // 期待結果（2）: evaluationDateTimeがリクエスト時刻で統一されている
    expect(result.evaluationDateTime).toBe('2025-01-15T10:00:00Z');

    // 期待結果（3）: rankedFacilitiesが前回キャッシュされた拠点リスク情報を含む
    expect(result.rankedFacilities).toHaveLength(2);
    expect(result.rankedFacilities[0]).toEqual({
      facilityId: 'F001',
      facilityName: 'Facility 001',
      riskScore: 75,
      riskLevel: 'HIGH',
      predictedDelayDays: 3,
      currentProgressRate: 45,
      plannedProgressRate: 70,
      priorityRank: 1,
    });
    expect(result.rankedFacilities[1]).toEqual({
      facilityId: 'F002',
      facilityName: 'Facility 002',
      riskScore: 45,
      riskLevel: 'MEDIUM',
      predictedDelayDays: 1,
      currentProgressRate: 65,
      plannedProgressRate: 75,
      priorityRank: 2,
    });

    // 期待結果（4）: delayReasonClassificationsが前回キャッシュされた拠点別遅延要因分類を含む
    expect(result.delayReasonClassifications).toHaveLength(1);
    expect(result.delayReasonClassifications[0]).toEqual({
      facilityId: 'F001',
      teamId: undefined,
      insufficientStaffContribution: 60,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 10,
      primaryDelayReason: 'INSUFFICIENT_STAFF',
      responseUrgency: 'IMMEDIATE',
    });

    // 期待結果（5）: recommendedAdjustmentsが前回キャッシュされた推奨調整内容を含む
    expect(result.recommendedAdjustments).toHaveLength(1);
    expect(result.recommendedAdjustments[0]).toEqual({
      facilityId: 'F001',
      adjustmentType: 'ADD_PERSONNEL',
      adjustmentDescription: '他拠点から2名の人員融通',
      estimatedEffectiveness: 70,
      implementationPriority: 1,
    });

    // 期待結果（6）: hasHighRiskFacilitiesが前回キャッシュされた値である
    expect(result.hasHighRiskFacilities).toBe(true);

    // エラーが発生していないことを確認
    expect(result).toBeDefined();
    expect(Object.keys(result)).toContain('judgmentId');
    expect(Object.keys(result)).toContain('evaluationDateTime');
    expect(Object.keys(result)).toContain('rankedFacilities');
    expect(Object.keys(result)).toContain('delayReasonClassifications');
    expect(Object.keys(result)).toContain('recommendedAdjustments');
    expect(Object.keys(result)).toContain('hasHighRiskFacilities');
  });
});