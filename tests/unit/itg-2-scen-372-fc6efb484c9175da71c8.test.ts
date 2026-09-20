import { renderProductivityDashboard, RenderProductivityDashboardInput, RenderProductivityDashboardOutput } from '../../src/logic/productivity-dashboard-presentation';
import * as productivityModule from '../../src/logic/productivity-dashboard-presentation';

describe('SCEN-372: RenderProductivityDashboard - Default Period (Last 30 Days)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard with last 30 days period when dates are not specified', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockProductivityData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      productivityRate: 80 + Math.random() * 20,
      completedItems: 10 + Math.floor(Math.random() * 5),
      actualWorkMinutes: 450 + Math.floor(Math.random() * 30),
      qualityScore: 85 + Math.random() * 15,
      proficiencyLevel: 'Intermediate',
    }));

    const mockPerformanceRecord = {
      id: 'PR001',
      workerId: 'W001',
      latestPerformanceDate: today.toISOString().split('T')[0],
      completedQuantity: 150,
      requiredTimeMinutes: 7200,
      qualityScore: 90,
      workContent: 'Assembly tasks',
      remarks: null,
    };

    const mockInitialAssignment = {
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly Line',
      assignmentStartDate: new Date(today.getTime() - 60 * 86400000).toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    };

    const mockPlacementPlan = Array.from({ length: 30 }, (_, i) => ({
      id: `PP${i}`,
      workerId: 'W001',
      plannedWorkHours: 480 + Math.floor(Math.random() * 30),
      actualWorkHours: 450 + Math.floor(Math.random() * 30),
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve(mockProductivityData);
    });
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve([mockPerformanceRecord]);
    });
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue(mockInitialAssignment);
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve(mockPlacementPlan);
    });

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
      collectionPeriodStartDate: undefined,
      collectionPeriodEndDate: undefined,
      workTypeFilter: undefined,
    };

    const result = await renderProductivityDashboard(input);

    expect(result).toBeDefined();
    expect(result.appliedFilters).toBeDefined();
    expect(result.appliedFilters.collectionPeriodStartDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
    expect(result.appliedFilters.collectionPeriodEndDate).toBe(today.toISOString().split('T')[0]);
  });

  it('should include data for exactly 30 days when using default period', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockProductivityData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      productivityRate: 80 + Math.random() * 20,
      completedItems: 10 + Math.floor(Math.random() * 5),
      actualWorkMinutes: 450 + Math.floor(Math.random() * 30),
      qualityScore: 85 + Math.random() * 15,
      proficiencyLevel: 'Intermediate',
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.productivityTimeSeriesData).toBeDefined();
    expect(result.productivityTimeSeriesData.length).toBeGreaterThan(0);
    expect(result.productivityTimeSeriesData.length).toBeLessThanOrEqual(30);

    result.productivityTimeSeriesData.forEach(point => {
      const pointDate = new Date(point.date);
      pointDate.setHours(0, 0, 0, 0);
      expect(pointDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      expect(pointDate.getTime()).toBeLessThanOrEqual(today.getTime());
    });
  });

  it('should include today in the collected data', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockProductivityData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      productivityRate: 80 + Math.random() * 20,
      completedItems: 10 + Math.floor(Math.random() * 5),
      actualWorkMinutes: 450 + Math.floor(Math.random() * 30),
      qualityScore: 85 + Math.random() * 15,
      proficiencyLevel: 'Intermediate',
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    const hasToday = result.productivityTimeSeriesData.some(point => point.date === todayString);
    expect(hasToday).toBe(true);
  });

  it('should have performance record panel with data from last 30 days period', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockPerformanceRecords = Array.from({ length: 5 }, (_, i) => ({
      id: `PR00${i}`,
      workerId: 'W001',
      latestPerformanceDate: new Date(thirtyDaysAgo.getTime() + i * 86400000 * 6).toISOString().split('T')[0],
      completedQuantity: 30 + i * 10,
      requiredTimeMinutes: 1440 + i * 100,
      qualityScore: 85 + i * 2,
      workContent: 'Assembly tasks',
      remarks: null,
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve(mockPerformanceRecords);
    });
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.performanceRecordPanel).toBeDefined();
    expect(result.performanceRecordPanel.latestPerformanceDate).toBeDefined();
    const latestDate = new Date(result.performanceRecordPanel.latestPerformanceDate);
    latestDate.setHours(0, 0, 0, 0);
    expect(latestDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
    expect(latestDate.getTime()).toBeLessThanOrEqual(today.getTime());
    expect(result.performanceRecordPanel.completedQuantity).toBeGreaterThan(0);
    expect(result.performanceRecordPanel.requiredTimeMinutes).toBeGreaterThan(0);
    expect(result.performanceRecordPanel.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.performanceRecordPanel.qualityScore).toBeLessThanOrEqual(100);
  });

  it('should have comparison table with data from last 30 days', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockComparisonData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      plannedWorkHours: 480,
      actualWorkHours: 450,
      timeDifference: -30,
      achievementRate: 93.75,
      plannedCompletionItems: 10,
      actualCompletionItems: 9,
      itemDifference: -1,
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve(mockComparisonData);
    });

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.comparisonTable).toBeDefined();
    expect(Array.isArray(result.comparisonTable)).toBe(true);
    expect(result.comparisonTable.length).toBeGreaterThan(0);
    expect(result.comparisonTable.length).toBeLessThanOrEqual(30);

    result.comparisonTable.forEach(row => {
      expect(row.date).toBeDefined();
      const rowDate = new Date(row.date);
      rowDate.setHours(0, 0, 0, 0);
      expect(rowDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      expect(rowDate.getTime()).toBeLessThanOrEqual(today.getTime());
      expect(row.plannedWorkHours).toBeGreaterThanOrEqual(0);
      expect(row.actualWorkHours).toBeGreaterThanOrEqual(0);
      expect(row.timeDifference).toBeDefined();
      expect(row.achievementRate).toBeGreaterThanOrEqual(0);
      expect(row.plannedCompletionItems).toBeGreaterThanOrEqual(0);
      expect(row.actualCompletionItems).toBeGreaterThanOrEqual(0);
      expect(row.itemDifference).toBeDefined();
    });
  });

  it('should have deviation analysis chart for last 30 days period', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockDeviationPoints = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      plannedValue: 100,
      actualValue: 93,
      deviationPercentage: -7,
      isAnomaly: false,
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'buildDeviationAnalysisChart' as any).mockResolvedValue({
      deviationPoints: mockDeviationPoints,
      averageDeviation: -7,
      trend: 'stable',
      hasAnomalies: false,
    });

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.deviationAnalysisChart).toBeDefined();
    expect(result.deviationAnalysisChart.deviationPoints).toBeDefined();
    expect(Array.isArray(result.deviationAnalysisChart.deviationPoints)).toBe(true);
    expect(result.deviationAnalysisChart.deviationPoints.length).toBeLessThanOrEqual(30);
    
    result.deviationAnalysisChart.deviationPoints.forEach(point => {
      const pointDate = new Date(point.date);
      pointDate.setHours(0, 0, 0, 0);
      expect(pointDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      expect(pointDate.getTime()).toBeLessThanOrEqual(today.getTime());
      expect(point.plannedValue).toBeDefined();
      expect(point.actualValue).toBeDefined();
      expect(point.deviationPercentage).toBeDefined();
      expect(point.isAnomaly).toBeDefined();
    });
    
    expect(result.deviationAnalysisChart.averageDeviation).toBeDefined();
    expect(typeof result.deviationAnalysisChart.averageDeviation).toBe('number');
    expect(result.deviationAnalysisChart.trend).toBeDefined();
    expect(result.deviationAnalysisChart.hasAnomalies).toBeDefined();
    expect(typeof result.deviationAnalysisChart.hasAnomalies).toBe('boolean');
  });

  it('should have quality variance alerts only from last 30 days', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockAlerts = [
      {
        detectionDateTime: new Date(today.getTime() - 86400000).toISOString(),
        alertLevel: 'Medium',
        content: 'Quality score below threshold',
        recommendedAction: 'Review work process',
      },
    ];

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'detectQualityVarianceAlerts' as any).mockImplementation((workerId: string, startDate: string, endDate: string) => {
      expect(startDate).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
      expect(endDate).toBe(today.toISOString().split('T')[0]);
      return Promise.resolve(mockAlerts);
    });

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.qualityVarianceAlerts).toBeDefined();
    expect(Array.isArray(result.qualityVarianceAlerts)).toBe(true);

    result.qualityVarianceAlerts.forEach(alert => {
      const alertDate = new Date(alert.detectionDateTime);
      alertDate.setHours(0, 0, 0, 0);
      expect(alertDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      expect(alertDate.getTime()).toBeLessThanOrEqual(today.getTime());
    });
  });

  it('should have data accumulation status indicating 30 days accumulated', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockProductivityData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      productivityRate: 80,
      completedItems: 10,
      actualWorkMinutes: 450,
      qualityScore: 85,
      proficiencyLevel: 'Intermediate',
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.dataAccumulationStatus).toBeDefined();
    expect(result.dataAccumulationStatus.accumulatedDays).toBe(30);
    expect(result.dataAccumulationStatus.dataRecordCount).toBeGreaterThan(0);
    expect(result.dataAccumulationStatus.dataRecordCount).toBeLessThanOrEqual(30);
    expect(result.dataAccumulationStatus.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(result.dataAccumulationStatus.coveragePercentage).toBeLessThanOrEqual(100);
    expect(result.dataAccumulationStatus.lastUpdatedDateTime).toBeDefined();

    const lastUpdatedDate = new Date(result.dataAccumulationStatus.lastUpdatedDateTime);
    expect(lastUpdatedDate.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
  });

  it('should return output with all required fields', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result: RenderProductivityDashboardOutput = await renderProductivityDashboard(input);

    expect(result.workerSummaryCard).toBeDefined();
    expect(result.productivityTimeSeriesData).toBeDefined();
    expect(result.proficiencyLevelDisplay).toBeDefined();
    expect(result.initialAssignmentPlanPanel).toBeDefined();
    expect(result.performanceRecordPanel).toBeDefined();
    expect(result.comparisonTable).toBeDefined();
    expect(result.deviationAnalysisChart).toBeDefined();
    expect(result.qualityVarianceAlerts).toBeDefined();
    expect(result.patternRecognitionResults).toBeDefined();
    expect(result.dataAccumulationStatus).toBeDefined();
    expect(result.appliedFilters).toBeDefined();
  });

  it('should have worker summary card with valid values', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.workerSummaryCard.workerName).toBeDefined();
    expect(typeof result.workerSummaryCard.workerName).toBe('string');
    expect(result.workerSummaryCard.jobTitle).toBeDefined();
    expect(result.workerSummaryCard.departmentName).toBeDefined();
    expect(result.workerSummaryCard.operationStatus).toBeDefined();
    expect(result.workerSummaryCard.averageProductivityRate).toBeGreaterThanOrEqual(0);
    expect(result.workerSummaryCard.averageProductivityRate).toBeLessThanOrEqual(100);
    expect(result.workerSummaryCard.totalCompletedItems).toBeGreaterThanOrEqual(0);
    expect(result.workerSummaryCard.totalWorkHours).toBeGreaterThanOrEqual(0);
  });

  it('should have proficiency level display with valid values', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.proficiencyLevelDisplay.currentLevel).toBeDefined();
    expect(typeof result.proficiencyLevelDisplay.currentLevel).toBe('string');
    expect(result.proficiencyLevelDisplay.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(result.proficiencyLevelDisplay.progressPercentage).toBeLessThanOrEqual(100);
    expect(result.proficiencyLevelDisplay.trendDirection).toBeDefined();
  });

  it('should have initial assignment plan panel', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.initialAssignmentPlanPanel.assignmentId).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignedDepartment).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignedProcess).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignmentStartDate).toBeDefined();
    expect(result.initialAssignmentPlanPanel.assignmentStatus).toBeDefined();
  });

  it('should have pattern recognition results', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.patternRecognitionResults).toBeDefined();
    expect(Array.isArray(result.patternRecognitionResults)).toBe(true);

    result.patternRecognitionResults.forEach(pattern => {
      expect(pattern.patternType).toBeDefined();
      expect(pattern.workTypeId).toBeDefined();
      expect(pattern.workTypeName).toBeDefined();
      expect(pattern.productivityRate).toBeGreaterThanOrEqual(0);
      expect(pattern.productivityRate).toBeLessThanOrEqual(100);
      expect(pattern.confidence).toBeGreaterThanOrEqual(0);
      expect(pattern.confidence).toBeLessThanOrEqual(100);
      expect(pattern.sampleSize).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have applied filters with correct work type information', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    expect(result.appliedFilters.appliedWorkTypes).toBeDefined();
    expect(Array.isArray(result.appliedFilters.appliedWorkTypes)).toBe(true);

    result.appliedFilters.appliedWorkTypes.forEach(workType => {
      expect(workType.workTypeId).toBeDefined();
      expect(workType.workTypeName).toBeDefined();
    });
  });

  it('should have productivity time series data with all required fields', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const mockWorker = {
      id: 'W001',
      name: 'Worker One',
      jobTitle: 'Assembler',
      departmentName: 'Manufacturing',
      operationStatus: 'Active',
    };

    const mockProductivityData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(thirtyDaysAgo.getTime() + i * 86400000).toISOString().split('T')[0],
      productivityRate: 80 + Math.random() * 20,
      completedItems: 10 + Math.floor(Math.random() * 5),
      actualWorkMinutes: 450 + Math.floor(Math.random() * 30),
      qualityScore: 85 + Math.random() * 15,
      proficiencyLevel: 'Intermediate',
    }));

    jest.spyOn(productivityModule, 'authorizeUserAction' as any).mockResolvedValue(true);
    jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue(mockWorker);
    jest.spyOn(productivityModule, 'findProductivityDataByWorkerAndPeriod' as any).mockResolvedValue(mockProductivityData);
    jest.spyOn(productivityModule, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockResolvedValue([]);
    jest.spyOn(productivityModule, 'findInitialAssignmentByWorker' as any).mockResolvedValue({
      assignmentId: 'IA001',
      assignedDepartment: 'Manufacturing',
      assignedProcess: 'Assembly',
      assignmentStartDate: thirtyDaysAgo.toISOString().split('T')[0],
      assignmentEndDate: null,
      assignmentStatus: 'Active',
      remarks: null,
    });
    jest.spyOn(productivityModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue([]);

    const input: RenderProductivityDashboardInput = {
      workerId: 'W001',
      userId: 'U001',
    };

    const result = await renderProductivityDashboard(input);

    result.productivityTimeSeriesData.forEach(dataPoint => {
      expect(dataPoint.date).toBeDefined();
      expect(dataPoint.productivityRate).toBeGreaterThanOrEqual(0);
      expect(dataPoint.productivityRate).toBeLessThanOrEqual(100);
      expect(dataPoint.completedItems).toBeGreaterThanOrEqual(0);
      expect(dataPoint.actualWorkMinutes).toBeGreaterThanOrEqual(0);
      expect(dataPoint.qualityScore).toBeGreaterThanOrEqual(0);
      expect(dataPoint.qualityScore).toBeLessThanOrEqual(100);
    });
  });
});