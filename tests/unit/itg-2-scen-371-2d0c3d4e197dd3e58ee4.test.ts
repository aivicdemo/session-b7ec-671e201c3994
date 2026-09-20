import { renderProductivityDashboard } from '../../src/logic/productivity-dashboard-presentation';
import * as productivityModule from '../../src/logic/productivity-dashboard-presentation';

describe('SCEN-371: renderProductivityDashboard with default collection period', () => {
  const workerId = 'worker-123';
  const userId = 'user-456';
  const today = new Date('2024-01-31');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(today);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should calculate past 30 days as default collection period when dates are not specified', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    const result = await renderProductivityDashboard(input);

    const expectedStartDate = '2024-01-02';
    const expectedEndDate = '2024-01-31';

    expect(result.appliedFilters.collectionPeriodStartDate).toBe(expectedStartDate);
    expect(result.appliedFilters.collectionPeriodEndDate).toBe(expectedEndDate);
  });

  it('should invoke authorizeUserAction to verify permissions', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    const authorizeUserActionSpy = jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(authorizeUserActionSpy).toHaveBeenCalled();
  });

  it('should invoke findWorkerById with the specified workerId', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    const findWorkerByIdSpy = jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(findWorkerByIdSpy).toHaveBeenCalledWith(workerId);
  });

  it('should invoke findProductivityDataByWorkerAndPeriod with past 30 days period', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    const findProductivityDataSpy = jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(findProductivityDataSpy).toHaveBeenCalledWith(
      workerId,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );

    const calls = findProductivityDataSpy.mock.calls;
    if (calls.length > 0) {
      const [, startDate, endDate] = calls[0];
      expect(startDate).toBe('2024-01-02');
      expect(endDate).toBe('2024-01-31');
    }
  });

  it('should invoke findPerformanceRecordsByWorkerAndPeriod with past 30 days period', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    const findPerformanceRecordsSpy = jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(findPerformanceRecordsSpy).toHaveBeenCalledWith(
      workerId,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );

    const calls = findPerformanceRecordsSpy.mock.calls;
    if (calls.length > 0) {
      const [, startDate, endDate] = calls[0];
      expect(startDate).toBe('2024-01-02');
      expect(endDate).toBe('2024-01-31');
    }
  });

  it('should invoke findInitialAssignmentByWorker to fetch assignment data', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    const findInitialAssignmentSpy = jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(findInitialAssignmentSpy).toHaveBeenCalledWith(workerId);
  });

  it('should invoke findPlacementPlanByWorkerAndDate with past 30 days period', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    const findPlacementPlanSpy = jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    await renderProductivityDashboard(input);

    expect(findPlacementPlanSpy).toHaveBeenCalledWith(
      workerId,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );

    const calls = findPlacementPlanSpy.mock.calls;
    if (calls.length > 0) {
      const [, startDate, endDate] = calls[0];
      expect(startDate).toBe('2024-01-02');
      expect(endDate).toBe('2024-01-31');
    }
  });

  it('should set appliedFilters with correct ISO 8601 date format for past 30 days', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    const result = await renderProductivityDashboard(input);

    expect(result.appliedFilters.collectionPeriodStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.appliedFilters.collectionPeriodEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const startDateObj = new Date(result.appliedFilters.collectionPeriodStartDate);
    const endDateObj = new Date(result.appliedFilters.collectionPeriodEndDate);
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(29);
  });

  it('should aggregate all dashboard output fields with past 30 days data', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    const result = await renderProductivityDashboard(input);

    expect(result.workerSummaryCard).toBeDefined();
    expect(result.workerSummaryCard.workerName).toBeDefined();
    expect(result.workerSummaryCard.jobTitle).toBeDefined();
    expect(result.workerSummaryCard.departmentName).toBeDefined();
    expect(result.workerSummaryCard.operationStatus).toBeDefined();
    expect(typeof result.workerSummaryCard.averageProductivityRate).toBe('number');
    expect(typeof result.workerSummaryCard.totalCompletedItems).toBe('number');
    expect(typeof result.workerSummaryCard.totalWorkHours).toBe('number');

    expect(result.productivityTimeSeriesData).toBeDefined();
    expect(Array.isArray(result.productivityTimeSeriesData)).toBe(true);
    if (result.productivityTimeSeriesData.length > 0) {
      result.productivityTimeSeriesData.forEach((point) => {
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof point.productivityRate).toBe('number');
        expect(typeof point.completedItems).toBe('number');
        expect(typeof point.actualWorkMinutes).toBe('number');
        expect(typeof point.qualityScore).toBe('number');
      });
    }

    expect(result.proficiencyLevelDisplay).toBeDefined();
    expect(result.proficiencyLevelDisplay.currentLevel).toBeDefined();
    expect(typeof result.proficiencyLevelDisplay.progressPercentage).toBe('number');
    expect(result.proficiencyLevelDisplay.trendDirection).toBeDefined();

    expect(result.initialAssignmentPlanPanel).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignmentId).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignedDepartment).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignedProcess).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignmentStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.initialAssignmentPlanPanel.assignmentStatus).toBeDefined();

    expect(result.performanceRecordPanel).toBeDefined();
    expect(result.performanceRecordPanel.latestPerformanceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof result.performanceRecordPanel.completedQuantity).toBe('number');
    expect(typeof result.performanceRecordPanel.requiredTimeMinutes).toBe('number');
    expect(typeof result.performanceRecordPanel.qualityScore).toBe('number');
    expect(result.performanceRecordPanel.workContent).toBeDefined();

    expect(result.comparisonTable).toBeDefined();
    expect(Array.isArray(result.comparisonTable)).toBe(true);
    if (result.comparisonTable.length > 0) {
      result.comparisonTable.forEach((row) => {
        expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof row.plannedWorkHours).toBe('number');
        expect(typeof row.actualWorkHours).toBe('number');
        expect(typeof row.timeDifference).toBe('number');
        expect(typeof row.achievementRate).toBe('number');
        expect(typeof row.plannedCompletionItems).toBe('number');
        expect(typeof row.actualCompletionItems).toBe('number');
        expect(typeof row.itemDifference).toBe('number');
      });
    }

    expect(result.deviationAnalysisChart).toBeDefined();
    expect(result.deviationAnalysisChart.deviationPoints).toBeDefined();
    expect(Array.isArray(result.deviationAnalysisChart.deviationPoints)).toBe(true);
    expect(typeof result.deviationAnalysisChart.averageDeviation).toBe('number');
    expect(result.deviationAnalysisChart.trend).toBeDefined();
    expect(typeof result.deviationAnalysisChart.hasAnomalies).toBe('boolean');

    expect(result.qualityVarianceAlerts).toBeDefined();
    expect(Array.isArray(result.qualityVarianceAlerts)).toBe(true);

    expect(result.patternRecognitionResults).toBeDefined();
    expect(Array.isArray(result.patternRecognitionResults)).toBe(true);
    if (result.patternRecognitionResults.length > 0) {
      result.patternRecognitionResults.forEach((pattern) => {
        expect(pattern.patternType).toBeDefined();
        expect(pattern.workTypeId).toBeDefined();
        expect(pattern.workTypeName).toBeDefined();
        expect(typeof pattern.productivityRate).toBe('number');
        expect(typeof pattern.confidence).toBe('number');
        expect(typeof pattern.sampleSize).toBe('number');
      });
    }

    expect(result.dataAccumulationStatus).toBeDefined();
    expect(typeof result.dataAccumulationStatus.accumulatedDays).toBe('number');
    expect(typeof result.dataAccumulationStatus.dataRecordCount).toBe('number');
    expect(typeof result.dataAccumulationStatus.coveragePercentage).toBe('number');
    expect(result.dataAccumulationStatus.lastUpdatedDateTime).toBeDefined();
    expect(result.dataAccumulationStatus.dataQualityStatus).toBeDefined();
  });

  it('should return appliedFilters matching the calculated past 30 days period', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    const result = await renderProductivityDashboard(input);

    const expectedStartDate = '2024-01-02';
    const expectedEndDate = '2024-01-31';

    expect(result.appliedFilters).toBeDefined();
    expect(result.appliedFilters.collectionPeriodStartDate).toBe(expectedStartDate);
    expect(result.appliedFilters.collectionPeriodEndDate).toBe(expectedEndDate);
    expect(Array.isArray(result.appliedFilters.appliedWorkTypes)).toBe(true);
  });

  it('should compute dates correctly when 30 days span across month boundary', async () => {
    jest.setSystemTime(new Date('2024-02-05'));

    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
    };

    const result = await renderProductivityDashboard(input);

    const startDate = new Date(result.appliedFilters.collectionPeriodStartDate);
    const endDate = new Date(result.appliedFilters.collectionPeriodEndDate);

    expect(endDate.toISOString().split('T')[0]).toBe('2024-02-05');
    expect(startDate.toISOString().split('T')[0]).toBe('2024-01-07');
  });

  it('should use past 30 days when neither date is specified', async () => {
    const mockWorker = {
      作業者ID: workerId,
      作業者名: 'Test Worker',
      職種: 'Operator',
      稼働状況: '稼働中',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(null);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input = {
      workerId,
      userId,
      collectionPeriodStartDate: undefined,
      collectionPeriodEndDate: undefined,
    };

    const result = await renderProductivityDashboard(input);

    expect(result.appliedFilters.collectionPeriodStartDate).toBe('2024-01-02');
    expect(result.appliedFilters.collectionPeriodEndDate).toBe('2024-01-31');
  });
});