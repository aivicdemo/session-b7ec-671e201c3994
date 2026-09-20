import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-087: 分析対象期間をデフォルト30日以外で指定した場合、指定期間の過去実績が正確に分析される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('新規配属作業者の過去60日間の実績データを分析し、正確な割当案を生成して承認者に提示する', async () => {
    // Arrange: テストデータ設定
    const workerId = 'WORKER-001';
    const executingUserId = 'USER-APPROVER-001';
    const analysisLookbackDays = 60;

    // 過去60日間の生産性データ（10件）
    const productivityData = [
      {
        date: '2024-08-17',
        productivityRate: 85,
        qualityScore: 92,
        jobType: 'JOBTYPE_PICKING',
      },
      {
        date: '2024-08-25',
        productivityRate: 88,
        qualityScore: 90,
        jobType: 'JOBTYPE_PICKING',
      },
      {
        date: '2024-09-01',
        productivityRate: 72,
        qualityScore: 78,
        jobType: 'JOBTYPE_PACKING',
      },
      {
        date: '2024-09-10',
        productivityRate: 75,
        qualityScore: 80,
        jobType: 'JOBTYPE_PACKING',
      },
      {
        date: '2024-09-20',
        productivityRate: 90,
        qualityScore: 95,
        jobType: 'JOBTYPE_PICKING',
      },
      {
        date: '2024-10-01',
        productivityRate: 82,
        qualityScore: 88,
        jobType: 'JOBTYPE_PICKING',
      },
      {
        date: '2024-10-10',
        productivityRate: 70,
        qualityScore: 75,
        jobType: 'JOBTYPE_PACKING',
      },
      {
        date: '2024-10-20',
        productivityRate: 86,
        qualityScore: 91,
        jobType: 'JOBTYPE_PICKING',
      },
      {
        date: '2024-11-01',
        productivityRate: 74,
        qualityScore: 81,
        jobType: 'JOBTYPE_PACKING',
      },
      {
        date: '2024-11-15',
        productivityRate: 89,
        qualityScore: 93,
        jobType: 'JOBTYPE_PICKING',
      },
    ];

    // 職務別習熟度レベル判定結果
    const proficiencyData = [
      {
        jobType: 'JOBTYPE_PICKING',
        proficiencyLevel: 'intermediate',
        evaluationDate: '2024-11-15T00:00:00Z',
        dataSource: 'productivity_analysis',
      },
      {
        jobType: 'JOBTYPE_PACKING',
        proficiencyLevel: 'beginner',
        evaluationDate: '2024-11-15T00:00:00Z',
        dataSource: 'productivity_analysis',
      },
    ];

    // 生成される割当案
    const generatedAllocationPlanIds = ['PLAN-001', 'PLAN-002', 'PLAN-003'];

    // 期待される生産性パターンサマリー（60日間のデータに基づく）
    const expectedProductivitySummary = {
      analysisStartDate: '2024-08-17T00:00:00Z',
      analysisEndDate: '2024-11-15T00:00:00Z',
      totalProductivityRecordsAnalyzed: 10,
      averageProductivityRate: 81.1,
      averageQualityScore: 86.3,
      strongJobTypes: [
        {
          jobType: 'JOBTYPE_PICKING',
          productivityRate: 86,
          qualityScore: 90.2,
          recordCount: 6,
        },
      ],
      weakJobTypes: [
        {
          jobType: 'JOBTYPE_PACKING',
          productivityRate: 73.7,
          qualityScore: 78.5,
          recordCount: 4,
        },
      ],
      productivityTrend: 'stable' as const,
    };

    // 期待される難度調整推奨
    const expectedDifficultyAdjustment = {
      recommendedInitialDifficulty: 'normal' as const,
      difficultyAdjustmentRationale:
        'JOBTYPE_PICKINGで平均86%の生産性、JOBTYPE_PACKINGで73.7%の生産性を示しており、習熟度は中程度。初期段階では得意なPICKINGから開始し、段階的に難度を上げることを推奨。',
      recommendedJobTypeSequence: ['JOBTYPE_PICKING', 'JOBTYPE_PACKING'],
      mentorshipRecommendation: false,
      mentorshipDetails: null,
    };

    const mockOutput: Tx5Imp1AgentOutput = {
      success: true,
      workerId,
      generatedAllocationPlanIds,
      productivityPatternSummary: expectedProductivitySummary,
      proficiencyLevelByJobType: proficiencyData,
      recommendedDifficultyAdjustment: expectedDifficultyAdjustment,
      approvalNotificationSent: true,
      approvalNotificationRecipients: [executingUserId],
      executionTimestamp: '2024-11-15T10:30:00Z',
      errorDetails: null,
    };

    const getLatestProductivityDataByWorkerMock = jest
      .fn()
      .mockResolvedValue(productivityData);

    // Act: 関数を実行
    const input: Tx5Imp1AgentInput = {
      workerId,
      executingUserId,
      analysisLookbackDays,
    };

    const aiClient = {
      authorizeOperation: jest.fn().mockResolvedValue(true),
      getWorkerById: jest.fn().mockResolvedValue({
        workerId,
        name: '新配属者太郎',
      }),
      getLatestProductivityDataByWorker: getLatestProductivityDataByWorkerMock,
      getLatestProficiencyByWorkerAndJobType: jest
        .fn()
        .mockResolvedValue(proficiencyData),
      listWorkInstructionsByCondition: jest
        .fn()
        .mockResolvedValue([
          { workInstructionId: 'WI-001', jobType: 'JOBTYPE_PICKING' },
          { workInstructionId: 'WI-002', jobType: 'JOBTYPE_PACKING' },
        ]),
      generateAllocationPlans: jest
        .fn()
        .mockResolvedValue(generatedAllocationPlanIds),
      extractAndRankAllocationPlansForReview: jest
        .fn()
        .mockResolvedValue(generatedAllocationPlanIds),
      saveAllocationPlan: jest.fn().mockResolvedValue({ success: true }),
      deliverAllocationInstructionToFieldLeader: jest
        .fn()
        .mockResolvedValue({
          approvalNotificationSent: true,
          approvalNotificationRecipients: [executingUserId],
        }),
      recordOperationAudit: jest.fn().mockResolvedValue({ success: true }),
    };

    const result = await runTx5Imp1Agent(input, aiClient);

    // Assert: 期待結果の確認
    expect(result.success).toBe(true);
    expect(result.workerId).toBe('WORKER-001');
    expect(result.generatedAllocationPlanIds).toEqual([
      'PLAN-001',
      'PLAN-002',
      'PLAN-003',
    ]);

    // 生産性パターンサマリーの確認
    expect(result.productivityPatternSummary).toBeDefined();
    expect(result.productivityPatternSummary.analysisStartDate).toBe(
      '2024-08-17T00:00:00Z',
    );
    expect(result.productivityPatternSummary.analysisEndDate).toBe(
      '2024-11-15T00:00:00Z',
    );
    expect(result.productivityPatternSummary.totalProductivityRecordsAnalyzed).toBe(
      10,
    );
    expect(result.productivityPatternSummary.averageProductivityRate).toBeCloseTo(
      81.1,
      1,
    );
    expect(result.productivityPatternSummary.averageQualityScore).toBeCloseTo(
      86.3,
      1,
    );

    // 得意作業・苦手作業の確認
    expect(result.productivityPatternSummary.strongJobTypes).toHaveLength(1);
    expect(result.productivityPatternSummary.strongJobTypes[0].jobType).toBe(
      'JOBTYPE_PICKING',
    );
    expect(result.productivityPatternSummary.weakJobTypes).toHaveLength(1);
    expect(result.productivityPatternSummary.weakJobTypes[0].jobType).toBe(
      'JOBTYPE_PACKING',
    );

    // 職務別習熟度の確認
    expect(result.proficiencyLevelByJobType).toHaveLength(2);
    expect(result.proficiencyLevelByJobType[0].jobType).toBe(
      'JOBTYPE_PICKING',
    );
    expect(result.proficiencyLevelByJobType[0].proficiencyLevel).toBe(
      'intermediate',
    );
    expect(result.proficiencyLevelByJobType[1].jobType).toBe('JOBTYPE_PACKING');
    expect(result.proficiencyLevelByJobType[1].proficiencyLevel).toBe(
      'beginner',
    );

    // 難度調整推奨内容の確認
    expect(result.recommendedDifficultyAdjustment).toBeDefined();
    expect(result.recommendedDifficultyAdjustment.recommendedInitialDifficulty).toBe(
      'normal',
    );
    expect(result.recommendedDifficultyAdjustment.recommendedJobTypeSequence).toEqual(
      ['JOBTYPE_PICKING', 'JOBTYPE_PACKING'],
    );
    expect(
      result.recommendedDifficultyAdjustment.mentorshipRecommendation,
    ).toBe(false);

    // 承認者への通知確認
    expect(result.approvalNotificationSent).toBe(true);
    expect(result.approvalNotificationRecipients).toContain(executingUserId);
    expect(result.executionTimestamp).toBe('2024-11-15T10:30:00Z');
    expect(result.errorDetails).toBeNull();

    // 指定された60日間の分析が実行されたことを確認
    // getLatestProductivityDataByWorkerがanalysisLookbackDays=60で呼び出されたことを検証
    expect(getLatestProductivityDataByWorkerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'WORKER-001',
        analysisLookbackDays: 60,
      }),
    );

    // minimumProductivityRecordsRequiredがデフォルト値で呼び出されたか、
    // またはundefinedで呼び出されたことを検証
    const callArgs = getLatestProductivityDataByWorkerMock.mock.calls[0][0];
    expect(callArgs.minimumProductivityRecordsRequired).toBeUndefined();
  });
});