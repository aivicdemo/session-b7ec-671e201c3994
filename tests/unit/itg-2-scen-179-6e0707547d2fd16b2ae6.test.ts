import { validateAggregatedPerformanceData } from '../../src/logic/data-quality-validation';

describe('SCEN-179: 異常値検出時のエラーハンドリング', () => {
  it('過去実績から統計的に有意な乖離や業務ルール違反の異常値が検出された場合、AnomalousValuesDetectedErrorが発生する', async () => {
    const input = {
      aggregationPeriodStartDate: '2024-01-01',
      aggregationPeriodEndDate: '2024-01-31',
      teamId: 'team-001',
      fieldLeaderUserId: 'leader-001',
      userAuthToken: 'valid-token-12345',
    };

    const mockAggregatedRecords = [
      {
        productivityDataId: 'rec-001',
        workerId: 'worker-001',
        plannedWorkingHours: 8,
        actualWorkingHours: 1,
        completedCount: -5,
        productivityRate: -62,
        qualityScore: 50,
        errorCount: 150,
        proficiencyLevel: 'intermediate',
      },
      {
        productivityDataId: 'rec-002',
        workerId: 'worker-002',
        plannedWorkingHours: 8,
        actualWorkingHours: 7,
        completedCount: 100,
        productivityRate: 95,
        qualityScore: 98,
        errorCount: 1,
        proficiencyLevel: 'advanced',
      },
    ];

    const mockHistoricalRecords = [
      {
        workerId: 'worker-001',
        productivityRate: 85,
        qualityScore: 88,
        completedCount: 50,
        errorCount: 2,
        recordDate: '2023-10-01',
      },
      {
        workerId: 'worker-001',
        productivityRate: 82,
        qualityScore: 90,
        completedCount: 48,
        errorCount: 3,
        recordDate: '2023-11-01',
      },
      {
        workerId: 'worker-001',
        productivityRate: 80,
        qualityScore: 89,
        completedCount: 52,
        errorCount: 2,
        recordDate: '2023-12-01',
      },
    ];

    const mockAnomalies = [
      {
        recordId: 'rec-001',
        workerId: 'worker-001',
        field: 'processingTime',
        anomalyType: 'STATISTICAL_OUTLIER' as const,
        severity: 'HIGH' as const,
        historicalAverage: 120,
        currentValue: 60,
        standardDeviation: 15,
        recommendedAction: '過去実績から大きく乖離した値が検出されました。作業状況を確認してください。',
      },
      {
        recordId: 'rec-001',
        workerId: 'worker-001',
        field: 'completionCount',
        anomalyType: 'BUSINESS_RULE_VIOLATION' as const,
        severity: 'CRITICAL' as const,
        currentValue: -5,
        recommendedAction: '当該作業者の処理時間が異常値です。作業方法の見直しと個別指導が必要。',
      },
    ];

    const mockImprovementGuidance = [
      {
        priority: 'CRITICAL' as const,
        category: 'ANOMALY' as const,
        action: '当該作業者の処理時間が異常値です。作業方法の見直しと個別指導が必要。',
        affectedRecordCount: 2,
        estimatedResolutionTime: '2時間',
        targetCompletionDate: '2024-02-02',
      },
    ];

    const dataQualityValidationModule = require('../../src/logic/data-quality-validation');

    // スタブ設定
    const authenticateUserMock = jest.spyOn(dataQualityValidationModule, 'authenticateUser').mockResolvedValue({
      userId: 'leader-001',
      role: 'fieldLeader',
      siteId: 'site-001',
    });

    const authorizeUserActionMock = jest.spyOn(dataQualityValidationModule, 'authorizeUserAction').mockResolvedValue(true);

    const findProductivityDataByTeamAndPeriodMock = jest
      .spyOn(dataQualityValidationModule, 'findProductivityDataByTeamAndPeriod')
      .mockResolvedValue(mockAggregatedRecords);

    const findPerformanceRecordsByWorkerIdsMock = jest
      .spyOn(dataQualityValidationModule, 'findPerformanceRecordsByWorkerIds')
      .mockResolvedValue(mockHistoricalRecords);

    const assessDataCompletenessMock = jest.spyOn(dataQualityValidationModule, 'assessDataCompleteness').mockResolvedValue({
      status: 'PASS',
      missingFieldCount: 0,
      expectedRecordCount: 2,
      actualRecordCount: 2,
      completenessPercentage: 100,
      details: [],
    });

    const assessDataAccuracyMock = jest.spyOn(dataQualityValidationModule, 'assessDataAccuracy').mockResolvedValue({
      status: 'PASS',
      inconsistencyCount: 0,
      outOfRangeCount: 0,
      details: [],
    });

    const detectAnomalousValuesMock = jest.spyOn(dataQualityValidationModule, 'detectAnomalousValues').mockResolvedValue({
      status: 'DETECTED' as const,
      anomalousRecordCount: 2,
      anomalies: mockAnomalies,
      detectionExecutedAt: new Date().toISOString(),
    });

    const generateQualityJudgmentMock = jest.spyOn(dataQualityValidationModule, 'generateQualityJudgment').mockResolvedValue({
      judgment: 'CONDITIONAL_APPROVAL' as const,
      judgmentReason: '異常値が検出されたため条件付き承認',
      qualityScore: 72,
      approvalEligibility: false,
      componentScores: {
        completenessScore: 100,
        accuracyScore: 100,
        anomalyScore: 30,
      },
    });

    const generateImprovementGuidanceMock = jest.spyOn(dataQualityValidationModule, 'generateImprovementGuidance').mockResolvedValue({
      guidanceItems: mockImprovementGuidance,
      generatedAt: new Date().toISOString(),
      totalGuidanceCount: 1,
      criticalActionCount: 1,
    });

    const sendQualityValidationResultToFieldLeaderMock = jest
      .spyOn(dataQualityValidationModule, 'sendQualityValidationResultToFieldLeader')
      .mockResolvedValue({
        sent: true,
        recipientUserId: 'leader-001',
        notificationTimestamp: new Date().toISOString(),
        deliveryStatus: 'DELIVERED' as const,
      });

    // スタブ設定完了後、validateAggregatedPerformanceDataを呼び出し
    let errorThrown = false;
    let thrownError: any = null;

    try {
      await validateAggregatedPerformanceData(input);
      fail('AnomalousValuesDetectedErrorがスローされるべき');
    } catch (error: any) {
      errorThrown = true;
      thrownError = error;

      // エラーがスローされたことを検証
      expect(error.name).toBe('AnomalousValuesDetectedError');
      expect(error.message).toBe('異常値が検出されました。異常値の詳細と推奨確認項目を改善指示に含めます。');
    }

    // エラーがスローされたことを確認
    expect(errorThrown).toBe(true);

    // 認証・認可関数が呼び出されたことを検証
    expect(authenticateUserMock).toHaveBeenCalledWith(input.userAuthToken);
    expect(authorizeUserActionMock).toHaveBeenCalled();

    // データ取得関数が呼び出されたことを検証
    expect(findProductivityDataByTeamAndPeriodMock).toHaveBeenCalledWith(
      input.teamId,
      input.aggregationPeriodStartDate,
      input.aggregationPeriodEndDate
    );

    // 過去実績データ取得が呼び出されたことを検証（仕様の要件）
    expect(findPerformanceRecordsByWorkerIdsMock).toHaveBeenCalled();

    // 異常値検出が呼び出されたことを検証（エラースロー直前）
    expect(detectAnomalousValuesMock).toHaveBeenCalled();

    // 改善指示生成が呼び出されたことを検証
    expect(generateImprovementGuidanceMock).toHaveBeenCalled();

    // detectAnomalousValues が呼び出されたことを確認
    expect(detectAnomalousValuesMock).toHaveBeenCalledTimes(1);

    // 呼び出し順序の検証：findPerformanceRecordsByWorkerIds → detectAnomalousValues → generateImprovementGuidance
    const findPerformanceOrder = findPerformanceRecordsByWorkerIdsMock.mock.invocationCallOrder[0] || 0;
    const detectAnomalousOrder = detectAnomalousValuesMock.mock.invocationCallOrder[0] || 0;
    const generateImprovementOrder = generateImprovementGuidanceMock.mock.invocationCallOrder[0] || 0;

    expect(findPerformanceOrder).toBeLessThan(detectAnomalousOrder);
    expect(detectAnomalousOrder).toBeLessThan(generateImprovementOrder);

    // 実際にvalidateAggregatedPerformanceData内部で実行された処理検証
    // detectAnomalousValuesの呼び出し結果から、エラースロー直前の状態を検証
    const detectAnomalousValuesCallArgs = detectAnomalousValuesMock.mock.calls[0];
    expect(detectAnomalousValuesCallArgs).toBeDefined();

    // generateImprovementGuidanceの呼び出し結果から、エラースロー直前の状態を検証
    const generateImprovementGuidanceCallArgs = generateImprovementGuidanceMock.mock.calls[0];
    expect(generateImprovementGuidanceCallArgs).toBeDefined();

    // detectAnomalousValues が返したデータの内容を検証
    // status='DETECTED'、anomalousRecordCount=2、anomalies配列に2件
    const detectionResult = detectAnomalousValuesMock.mock.results[0].value;
    expect(detectionResult).toBeDefined();
    expect(detectionResult.status).toBe('DETECTED');
    expect(detectionResult.anomalousRecordCount).toBe(2);
    expect(detectionResult.anomalies).toHaveLength(2);

    // anomalies配列の第1件（STATISTICAL_OUTLIER）を検証
    const statisticalOutlier = detectionResult.anomalies.find(
      (a: any) => a.anomalyType === 'STATISTICAL_OUTLIER'
    );
    expect(statisticalOutlier).toBeDefined();
    expect(statisticalOutlier.recordId).toBe('rec-001');
    expect(statisticalOutlier.workerId).toBe('worker-001');
    expect(statisticalOutlier.field).toBe('processingTime');
    expect(statisticalOutlier.severity).toBe('HIGH');
    expect(statisticalOutlier.historicalAverage).toBe(120);
    expect(statisticalOutlier.currentValue).toBe(60);
    expect(statisticalOutlier.standardDeviation).toBe(15);
    expect(statisticalOutlier.recommendedAction).toBeDefined();

    // anomalies配列の第2件（BUSINESS_RULE_VIOLATION）を検証
    const businessRuleViolation = detectionResult.anomalies.find(
      (a: any) => a.anomalyType === 'BUSINESS_RULE_VIOLATION'
    );
    expect(businessRuleViolation).toBeDefined();
    expect(businessRuleViolation.recordId).toBe('rec-001');
    expect(businessRuleViolation.workerId).toBe('worker-001');
    expect(businessRuleViolation.field).toBe('completionCount');
    expect(businessRuleViolation.severity).toBe('CRITICAL');
    expect(businessRuleViolation.currentValue).toBe(-5);
    expect(businessRuleViolation.recommendedAction).toBeDefined();

    // generateImprovementGuidance が呼び出され、返却前のimprovementGuidance配列を検証
    const improvementGuidanceResult = generateImprovementGuidanceMock.mock.results[0].value;
    expect(improvementGuidanceResult).toBeDefined();
    expect(improvementGuidanceResult.guidanceItems).toBeDefined();
    expect(improvementGuidanceResult.guidanceItems.length).toBeGreaterThan(0);

    // priority='CRITICAL'、category='ANOMALY'、affectedRecordCount=2を含む改善指示が少なくとも1件存在することを検証
    const criticalGuidance = improvementGuidanceResult.guidanceItems.find(
      (g: any) => g.priority === 'CRITICAL' && g.category === 'ANOMALY' && g.affectedRecordCount === 2
    );
    expect(criticalGuidance).toBeDefined();
    expect(criticalGuidance.action).toBeDefined();
    expect(criticalGuidance.estimatedResolutionTime).toBe('2時間');
    expect(criticalGuidance.targetCompletionDate).toBe('2024-02-02');
  });
});