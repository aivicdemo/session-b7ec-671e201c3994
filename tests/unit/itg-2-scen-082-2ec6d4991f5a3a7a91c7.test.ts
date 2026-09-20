import { runTx5Imp2Agent } from '../../src/agents/tx-5-imp-2/orchestrator';

describe('SCEN-082: 習熟度が閾値に達しないまま監視期間が終了した場合、監視完了を報告する', () => {
  const newAssigneeId = 'assignee-001';
  const assignmentStartDate = '2024-01-01';
  const monitoringEndDate = '2024-01-31';

  const aptitudeTestResult = {
    testScore: 72,
    strongFields: ['組立'],
    recommendedDuties: ['基本作業'],
    overallAssessment: 'Standard performer'
  };

  // モック：類似者の習熟パターンデータ
  const mockSimilarWorkerPatterns = [
    {
      workTypeId: 'work-001',
      workTypeName: '組立',
      averageProductivityRate: 85,
      averageQualityScore: 88,
      averageTimeToThreshold: 25
    }
  ];

  // モック：実績データ（習熟度が閾値に達していない）
  const mockPerformanceData = [
    { date: '2024-01-10', productivityRate: 55, qualityScore: 60, completedQuantity: 20 },
    { date: '2024-01-17', productivityRate: 60, qualityScore: 62, completedQuantity: 25 },
    { date: '2024-01-24', productivityRate: 65, qualityScore: 65, completedQuantity: 30 },
    { date: '2024-01-31', productivityRate: 68, qualityScore: 68, completedQuantity: 32 }
  ];

  test('習熟度が閾値に達しないまま監視期間が終了した場合、monitoring_completed フェーズで監視完了を報告する', async () => {
    // 1. 初期割当推奨フェーズ
    const initialResult = await runTx5Imp2Agent(
      {
        newAssigneeId,
        aptitudeTestResult,
        assignmentStartDate,
        monitoringDurationDays: 30,
        proficiencyThreshold: 75,
        triggeredBy: 'manual_onboarding'
      },
      {
        fetchAptitudeTestResult: jest.fn().mockResolvedValue(aptitudeTestResult),
        searchSimilarWorkerPatterns: jest
          .fn()
          .mockResolvedValue(mockSimilarWorkerPatterns),
        generateInitialAssignmentRecommendation: jest
          .fn()
          .mockResolvedValue({
            recommendedWorkTypeId: 'work-001',
            recommendedWorkTypeName: '組立',
            recommendedDepartmentId: 'dept-001',
            recommendationReason:
              '適性テスト結果と類似者パターンに基づいて組立業務を推奨',
            peerPerformancePatterns: mockSimilarWorkerPatterns,
            expectedProficiencyReachDays: 25
          }),
        aggregatePerformanceDataByPeriod: jest
          .fn()
          .mockResolvedValue(mockPerformanceData),
        calculateProficiencyScore: jest.fn().mockResolvedValue(60),
        calculateProficiencyTrend: jest.fn().mockResolvedValue(5.0),
        generateDifficultyAdjustmentRecommendation: jest
          .fn()
          .mockResolvedValue(null),
        generateMonitoringCompletionSummary: jest.fn().mockResolvedValue({
          monitoringPeriodDays: 30,
          finalProficiencyLevel: 60,
          averageProductivityRate: 62,
          averageQualityScore: 63,
          totalCompletedQuantity: 107,
          recommendedNextAction: 'continue_current_assignment',
          completionNotes:
            '習熟度が調整判定の閾値に達していません。継続監視を行います。'
        }),
        sendOnboardingAnalysisResultToManager: jest
          .fn()
          .mockResolvedValue(true)
      }
    );

    // 初期割当推奨フェーズの検証
    expect(initialResult.phase).toBe('initial_assignment_recommendation');
    expect(initialResult.initialAssignmentRecommendation).toBeDefined();
    expect(initialResult.initialAssignmentRecommendation?.recommendedWorkTypeId).toBe(
      'work-001'
    );

    // 2. 監視フェーズに進む（同じ新配属者IDで再度呼び出し）
    const monitoringResult = await runTx5Imp2Agent(
      {
        newAssigneeId,
        aptitudeTestResult,
        assignmentStartDate,
        monitoringDurationDays: 30,
        proficiencyThreshold: 75,
        triggeredBy: 'scheduled_monitoring'
      },
      {
        fetchAptitudeTestResult: jest.fn().mockResolvedValue(aptitudeTestResult),
        searchSimilarWorkerPatterns: jest
          .fn()
          .mockResolvedValue(mockSimilarWorkerPatterns),
        generateInitialAssignmentRecommendation: jest
          .fn()
          .mockResolvedValue({
            recommendedWorkTypeId: 'work-001',
            recommendedWorkTypeName: '組立',
            recommendedDepartmentId: 'dept-001',
            recommendationReason:
              '適性テスト結果と類似者パターンに基づいて組立業務を推奨',
            peerPerformancePatterns: mockSimilarWorkerPatterns,
            expectedProficiencyReachDays: 25
          }),
        aggregatePerformanceDataByPeriod: jest
          .fn()
          .mockResolvedValue(mockPerformanceData),
        calculateProficiencyScore: jest.fn().mockResolvedValue(60),
        calculateProficiencyTrend: jest.fn().mockResolvedValue(5.0),
        generateDifficultyAdjustmentRecommendation: jest
          .fn()
          .mockResolvedValue(null),
        generateMonitoringCompletionSummary: jest.fn().mockResolvedValue({
          monitoringPeriodDays: 30,
          finalProficiencyLevel: 60,
          averageProductivityRate: 62,
          averageQualityScore: 63,
          totalCompletedQuantity: 107,
          recommendedNextAction: 'continue_current_assignment',
          completionNotes:
            '習熟度が調整判定の閾値に達していません。継続監視を行います。'
        }),
        sendOnboardingAnalysisResultToManager: jest
          .fn()
          .mockResolvedValue(true)
      }
    );

    // 3. phase が 'monitoring_completed' に遷移していることを確認
    expect(monitoringResult.phase).toBe('monitoring_completed');

    // 4. monitoringStatus が記録されていることを確認
    expect(monitoringResult.monitoringStatus).toBeDefined();

    // 5. monitoringCompletionSummary が出力されていることを確認
    expect(monitoringResult.monitoringCompletionSummary).toBeDefined();
    expect(monitoringResult.monitoringCompletionSummary?.monitoringPeriodDays).toBe(30);
    expect(monitoringResult.monitoringCompletionSummary?.finalProficiencyLevel).toBe(60);
    expect(monitoringResult.monitoringCompletionSummary?.finalProficiencyLevel).toBeLessThan(75);
    expect(monitoringResult.monitoringCompletionSummary?.averageProductivityRate).toBe(62);
    expect(monitoringResult.monitoringCompletionSummary?.averageQualityScore).toBe(63);
    expect(monitoringResult.monitoringCompletionSummary?.totalCompletedQuantity).toBe(107);
    expect(monitoringResult.monitoringCompletionSummary?.recommendedNextAction).toBe(
      'continue_current_assignment'
    );
    expect(
      monitoringResult.monitoringCompletionSummary?.completionNotes
    ).toContain('習熟度が調整判定の閾値に達していません');

    // 6. difficultyAdjustmentRecommendation が null であることを確認（閾値未到達）
    expect(monitoringResult.difficultyAdjustmentRecommendation).toBeNull();

    // 7. notificationSent が true であることを確認
    expect(monitoringResult.notificationSent).toBe(true);

    // 8. executionTimestamp が ISO 8601 形式で出力されていることを確認
    expect(monitoringResult.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 9. errors 配列が空であるか、警告のみ含まれていることを確認
    expect(monitoringResult.errors).toBeDefined();
    expect(Array.isArray(monitoringResult.errors)).toBe(true);
    if (monitoringResult.errors && monitoringResult.errors.length > 0) {
      monitoringResult.errors.forEach((error) => {
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      });
    }

    // 10. initialAssignmentRecommendation は monitoring_completed フェーズでは null であることを確認
    expect(monitoringResult.initialAssignmentRecommendation).toBeNull();
  });
});