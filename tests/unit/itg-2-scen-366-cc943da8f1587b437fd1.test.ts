import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';

describe('SCEN-366: renderProductivityDashboard', () => {
  let mockAuthorizeUserAction: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindProductivityDataByWorkerAndPeriod: jest.Mock;
  let mockFindPerformanceRecordsByWorkerAndPeriod: jest.Mock;
  let mockFindInitialAssignmentByWorker: jest.Mock;
  let mockFindPlacementPlanByWorkerAndDate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeUserAction = jest.fn().mockResolvedValue({ authorized: true });
    mockFindWorkerById = jest.fn();
    mockFindProductivityDataByWorkerAndPeriod = jest.fn();
    mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn();
    mockFindInitialAssignmentByWorker = jest.fn();
    mockFindPlacementPlanByWorkerAndDate = jest.fn();

    jest.spyOn(require('../../src/logic/authorization'), 'authorizeUserAction').mockImplementation(mockAuthorizeUserAction);
    jest.spyOn(require('../../src/logic/worker-repository'), 'findWorkerById').mockImplementation(mockFindWorkerById);
    jest.spyOn(require('../../src/logic/worker-repository'), 'findProductivityDataByWorkerAndPeriod').mockImplementation(mockFindProductivityDataByWorkerAndPeriod);
    jest.spyOn(require('../../src/logic/worker-repository'), 'findPerformanceRecordsByWorkerAndPeriod').mockImplementation(mockFindPerformanceRecordsByWorkerAndPeriod);
    jest.spyOn(require('../../src/logic/worker-repository'), 'findInitialAssignmentByWorker').mockImplementation(mockFindInitialAssignmentByWorker);
    jest.spyOn(require('../../src/logic/worker-repository'), 'findPlacementPlanByWorkerAndDate').mockImplementation(mockFindPlacementPlanByWorkerAndDate);
  });

  it('指定された作業者の生産性ダッシュボード全項目が正常に表示用に整形・集計されて返される', async () => {
    const workerId = 'worker-001';
    const userId = 'user-001';
    const collectionPeriodStartDate = '2024-01-01';
    const collectionPeriodEndDate = '2024-01-31';
    const workTypeFilter = ['wt-001', 'wt-002'];

    mockAuthorizeUserAction.mockResolvedValue({ authorized: true });

    mockFindWorkerById.mockResolvedValue({
      workerId,
      workerName: '山田太郎',
      jobTitle: '検査員',
      departmentName: '品質管理部',
      operationStatus: 'アクティブ',
    });

    mockFindProductivityDataByWorkerAndPeriod.mockResolvedValue([
      {
        date: '2024-01-01',
        productivityRate: 85,
        completedItems: 50,
        actualWorkMinutes: 480,
        qualityScore: 90,
        proficiencyLevel: '中級',
      },
      {
        date: '2024-01-02',
        productivityRate: 88,
        completedItems: 52,
        actualWorkMinutes: 480,
        qualityScore: 92,
        proficiencyLevel: '中級',
      },
      {
        date: '2024-01-03',
        productivityRate: 87,
        completedItems: 51,
        actualWorkMinutes: 480,
        qualityScore: 91,
        proficiencyLevel: '中級',
      },
    ]);

    mockFindPerformanceRecordsByWorkerAndPeriod.mockResolvedValue({
      latestPerformanceDate: '2024-01-31',
      completedQuantity: 1530,
      requiredTimeMinutes: 14400,
      qualityScore: 90,
      workContent: '検査・品質管理',
      remarks: '問題なし',
    });

    mockFindInitialAssignmentByWorker.mockResolvedValue({
      assignmentId: 'assign-001',
      assignedDepartment: '品質管理部',
      assignedProcess: '検査工程',
      assignmentStartDate: '2023-12-01',
      assignmentEndDate: null,
      assignmentStatus: '有効',
      remarks: null,
    });

    mockFindPlacementPlanByWorkerAndDate.mockResolvedValue({
      configurationPeriodStartDate: '2024-01-01',
      configurationPeriodEndDate: '2024-01-31',
      planeWorkMinutes: 14400,
      actualWorkMinutes: 14400,
      plannedCompletionItems: 1500,
      actualCompletionItems: 1530,
    });

    const result = await renderProductivityDashboard({
      workerId,
      userId,
      collectionPeriodStartDate,
      collectionPeriodEndDate,
      workTypeFilter,
    });

    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(userId, expect.any(String));
    expect(mockFindWorkerById).toHaveBeenCalledWith(workerId);
    expect(mockFindProductivityDataByWorkerAndPeriod).toHaveBeenCalledWith(
      workerId,
      collectionPeriodStartDate,
      collectionPeriodEndDate,
      workTypeFilter
    );
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(
      workerId,
      collectionPeriodStartDate,
      collectionPeriodEndDate
    );
    expect(mockFindInitialAssignmentByWorker).toHaveBeenCalledWith(workerId);
    expect(mockFindPlacementPlanByWorkerAndDate).toHaveBeenCalled();

    expect(result).toBeDefined();
    expect(result.workerSummaryCard).toBeDefined();
    expect(result.workerSummaryCard.workerName).toBe('山田太郎');
    expect(result.workerSummaryCard.jobTitle).toBe('検査員');
    expect(result.workerSummaryCard.departmentName).toBe('品質管理部');
    expect(['アクティブ', '非アクティブ']).toContain(result.workerSummaryCard.operationStatus);
    expect(typeof result.workerSummaryCard.averageProductivityRate).toBe('number');
    expect(result.workerSummaryCard.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.workerSummaryCard.averageProductivityRate).toBeLessThanOrEqual(100);
    expect(typeof result.workerSummaryCard.totalCompletedItems).toBe('number');
    expect(result.workerSummaryCard.totalCompletedItems).toBeGreaterThan(0);
    expect(typeof result.workerSummaryCard.totalWorkHours).toBe('number');
    expect(result.workerSummaryCard.totalWorkHours).toBeGreaterThan(0);

    expect(Array.isArray(result.productivityTimeSeriesData)).toBe(true);
    expect(result.productivityTimeSeriesData.length).toBeGreaterThan(0);
    expect(result.productivityTimeSeriesData.length).toBe(3);
    const dates = result.productivityTimeSeriesData.map(p => p.date);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(new Date(dates[i - 1]).getTime());
    }
    result.productivityTimeSeriesData.forEach((point) => {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(typeof point.productivityRate).toBe('number');
      expect(point.productivityRate).toBeGreaterThanOrEqual(0);
      expect(point.productivityRate).toBeLessThanOrEqual(100);
      expect(typeof point.completedItems).toBe('number');
      expect(point.completedItems).toBeGreaterThanOrEqual(0);
      expect(typeof point.actualWorkMinutes).toBe('number');
      expect(point.actualWorkMinutes).toBeGreaterThanOrEqual(0);
    });

    expect(result.proficiencyLevelDisplay).toBeDefined();
    expect(result.proficiencyLevelDisplay.currentLevel).toBeDefined();
    expect(typeof result.proficiencyLevelDisplay.progressPercentage).toBe('number');
    expect(result.proficiencyLevelDisplay.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(result.proficiencyLevelDisplay.progressPercentage).toBeLessThanOrEqual(100);
    expect(['上昇', '横ばい', '低下']).toContain(result.proficiencyLevelDisplay.trendDirection);
    if (result.proficiencyLevelDisplay.estimatedNextLevelDate !== null) {
      expect(result.proficiencyLevelDisplay.estimatedNextLevelDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }

    expect(result.initialAssignmentPlanPanel).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignmentId).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignedDepartment).toBe('品質管理部');
    expect(result.initialAssignmentPlanPanel.assignedProcess).toBe('検査工程');
    expect(result.initialAssignmentPlanPanel.assignmentStartDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    if (result.initialAssignmentPlanPanel.assignmentEndDate !== null) {
      expect(result.initialAssignmentPlanPanel.assignmentEndDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
    expect(['有効', '終了', '保留中']).toContain(result.initialAssignmentPlanPanel.assignmentStatus);

    expect(result.performanceRecordPanel).toBeDefined();
    expect(result.performanceRecordPanel.latestPerformanceDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(result.performanceRecordPanel.latestPerformanceDate).toBe('2024-01-31');
    expect(typeof result.performanceRecordPanel.completedQuantity).toBe('number');
    expect(result.performanceRecordPanel.completedQuantity).toBe(1530);
    expect(typeof result.performanceRecordPanel.requiredTimeMinutes).toBe('number');
    expect(result.performanceRecordPanel.requiredTimeMinutes).toBe(14400);
    expect(typeof result.performanceRecordPanel.qualityScore).toBe('number');
    expect(result.performanceRecordPanel.qualityScore).toBe(90);
    expect(result.performanceRecordPanel.workContent).toBe('検査・品質管理');
    expect(result.performanceRecordPanel.remarks).toBe('問題なし');

    expect(Array.isArray(result.comparisonTable)).toBe(true);
    result.comparisonTable.forEach((row) => {
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(typeof row.plannedWorkHours).toBe('number');
      expect(row.plannedWorkHours).toBeGreaterThanOrEqual(0);
      expect(typeof row.actualWorkHours).toBe('number');
      expect(row.actualWorkHours).toBeGreaterThanOrEqual(0);
      expect(typeof row.timeDifference).toBe('number');
      expect(typeof row.achievementRate).toBe('number');
      expect(row.achievementRate).toBeGreaterThanOrEqual(0);
      expect(typeof row.plannedCompletionItems).toBe('number');
      expect(row.plannedCompletionItems).toBeGreaterThanOrEqual(0);
      expect(typeof row.actualCompletionItems).toBe('number');
      expect(row.actualCompletionItems).toBeGreaterThanOrEqual(0);
      expect(typeof row.itemDifference).toBe('number');
      const calculatedDifference = row.actualWorkHours - row.plannedWorkHours;
      expect(row.timeDifference).toBe(calculatedDifference);
      if (row.plannedWorkHours > 0) {
        const calculatedAchievementRate = (row.actualWorkHours / row.plannedWorkHours) * 100;
        expect(row.achievementRate).toBeCloseTo(calculatedAchievementRate, 2);
      }
    });

    expect(result.deviationAnalysisChart).toBeDefined();
    expect(Array.isArray(result.deviationAnalysisChart.deviationPoints)).toBe(true);
    result.deviationAnalysisChart.deviationPoints.forEach((point) => {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(typeof point.plannedValue).toBe('number');
      expect(typeof point.actualValue).toBe('number');
      expect(typeof point.deviationPercentage).toBe('number');
      expect(typeof point.isAnomaly).toBe('boolean');
      if (point.plannedValue > 0) {
        const expectedDeviation = ((point.actualValue - point.plannedValue) / point.plannedValue) * 100;
        expect(point.deviationPercentage).toBeCloseTo(expectedDeviation, 2);
      }
    });
    expect(typeof result.deviationAnalysisChart.averageDeviation).toBe('number');
    expect(['改善', '悪化', '横ばい']).toContain(result.deviationAnalysisChart.trend);
    expect(typeof result.deviationAnalysisChart.hasAnomalies).toBe('boolean');

    expect(Array.isArray(result.qualityVarianceAlerts)).toBe(true);
    result.qualityVarianceAlerts.forEach((alert) => {
      expect(alert).toHaveProperty('detectionDateTime');
      expect(alert.detectionDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(alert).toHaveProperty('alertLevel');
      expect(['warning', 'error', 'info']).toContain(alert.alertLevel);
      expect(alert).toHaveProperty('content');
      expect(typeof alert.content).toBe('string');
      expect(alert.content.length).toBeGreaterThan(0);
      expect(alert).toHaveProperty('recommendedAction');
      expect(typeof alert.recommendedAction).toBe('string');
      expect(alert.recommendedAction.length).toBeGreaterThan(0);
    });

    expect(Array.isArray(result.patternRecognitionResults)).toBe(true);
    result.patternRecognitionResults.forEach((pattern) => {
      expect(pattern.patternType).toBeDefined();
      expect(['得意作業', '苦手作業', '生産性パターン']).toContain(pattern.patternType);
      expect(pattern.workTypeId).toBeDefined();
      expect(typeof pattern.workTypeId).toBe('string');
      expect(pattern.workTypeName).toBeDefined();
      expect(typeof pattern.workTypeName).toBe('string');
      expect(typeof pattern.productivityRate).toBe('number');
      expect(pattern.productivityRate).toBeGreaterThanOrEqual(0);
      expect(pattern.productivityRate).toBeLessThanOrEqual(100);
      expect(typeof pattern.confidence).toBe('number');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0);
      expect(pattern.confidence).toBeLessThanOrEqual(100);
      expect(typeof pattern.sampleSize).toBe('number');
      expect(pattern.sampleSize).toBeGreaterThanOrEqual(0);
    });

    expect(result.dataAccumulationStatus).toBeDefined();
    expect(typeof result.dataAccumulationStatus.accumulatedDays).toBe('number');
    expect(result.dataAccumulationStatus.accumulatedDays).toBeGreaterThanOrEqual(0);
    expect(typeof result.dataAccumulationStatus.dataRecordCount).toBe('number');
    expect(result.dataAccumulationStatus.dataRecordCount).toBe(3);
    expect(typeof result.dataAccumulationStatus.coveragePercentage).toBe('number');
    expect(result.dataAccumulationStatus.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataAccumulationStatus.coveragePercentage).toBeLessThanOrEqual(100);
    expect(result.dataAccumulationStatus.lastUpdatedDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(['良好', '注意', '不十分']).toContain(result.dataAccumulationStatus.dataQualityStatus);

    expect(result.appliedFilters).toBeDefined();
    expect(result.appliedFilters.collectionPeriodStartDate).toBe(collectionPeriodStartDate);
    expect(result.appliedFilters.collectionPeriodEndDate).toBe(collectionPeriodEndDate);
    expect(Array.isArray(result.appliedFilters.appliedWorkTypes)).toBe(true);
    expect(result.appliedFilters.appliedWorkTypes.length).toBeGreaterThanOrEqual(0);
    result.appliedFilters.appliedWorkTypes.forEach((wt) => {
      expect(wt.workTypeId).toBeDefined();
      expect(typeof wt.workTypeId).toBe('string');
      expect(wt.workTypeName).toBeDefined();
      expect(typeof wt.workTypeName).toBe('string');
    });
  });
});