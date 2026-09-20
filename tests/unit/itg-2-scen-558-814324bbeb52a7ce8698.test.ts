import { savePerformanceRecord, SavePerformanceRecordInput, SavePerformanceRecordOutput } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-558: 作業日が過去90日前のときの正常系で新規作成が成功する', () => {
  it('過去90日前の作業日で実績記録の新規作成が成功する', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    const callTimeBeforeExecution = new Date();

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'uuid-new-001',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: pastDate,
      workContent: 'ピッキング作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-789',
      updatedBy: undefined,
      requestingUserId: 'user-789',
      operation: 'create',
    };

    const mockAuthorizeUserAction = jest.fn().mockResolvedValue(true);
    const mockValidateInputData = jest.fn().mockResolvedValue(true);
    const mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'テスト作業者',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'ピッキング',
      operatingStatus: 'active',
      hourlyRate: 1200,
      maxOperatingHours: 8,
      found: true,
    });
    const mockFindPlacementPlanByWorkerAndDate = jest.fn().mockResolvedValue({
      placementPlanId: 'plan-456',
      workerId: 'worker-123',
      placementDepartment: 'department-001',
      placementJobType: 'ピッキング',
      startDate: new Date(pastDate.getTime() - 24 * 60 * 60 * 1000),
      endDate: new Date(pastDate.getTime() + 24 * 60 * 60 * 1000),
      placementStatus: 'active',
      expectedProductivityTarget: 50,
      optimizationReason: null,
      found: true,
    });
    const mockFindPerformanceRecordsByWorkerAndPeriod = jest.fn().mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId: 'worker-123',
      periodStartDate: pastDate,
      periodEndDate: pastDate,
    });
    const mockCreatePerformanceRecord = jest.fn().mockResolvedValue({
      performanceRecordId: 'uuid-new-001',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: pastDate,
      workContent: 'ピッキング作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdAt: callTimeBeforeExecution,
      updatedAt: callTimeBeforeExecution,
    });

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockImplementation(mockAuthorizeUserAction);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockImplementation(mockValidateInputData);
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockImplementation(mockFindWorkerById);
    jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockImplementation(mockFindPlacementPlanByWorkerAndDate);
    jest.spyOn(persistenceLayer, 'findPerformanceRecordsByWorkerAndPeriod' as any).mockImplementation(mockFindPerformanceRecordsByWorkerAndPeriod);
    jest.spyOn(persistenceLayer, 'createPerformanceRecord' as any).mockImplementation(mockCreatePerformanceRecord);

    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);
    const callTimeAfterExecution = new Date();

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('uuid-new-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(callTimeBeforeExecution.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(callTimeAfterExecution.getTime());
    expect(result.message).toBeUndefined();

    expect(mockAuthorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({ requestingUserId: 'user-789' })
    );
    expect(mockValidateInputData).toHaveBeenCalledWith(input);
    expect(mockFindWorkerById).toHaveBeenCalledWith(
      expect.objectContaining({ workerId: 'worker-123', requestingUserId: 'user-789' })
    );
    expect(mockFindPlacementPlanByWorkerAndDate).toHaveBeenCalledWith(
      expect.objectContaining({ workerId: 'worker-123', targetDate: pastDate })
    );
    expect(mockFindPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(
      expect.objectContaining({ workerId: 'worker-123', startDate: pastDate, endDate: pastDate })
    );
    expect(mockCreatePerformanceRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        performanceRecordId: 'uuid-new-001',
        workerId: 'worker-123',
        placementPlanId: 'plan-456',
        workDate: pastDate,
        workContent: 'ピッキング作業',
        completionCount: 50,
        requiredTimeMinutes: 480,
        qualityScore: 85,
      })
    );
    
    expect(mockCreatePerformanceRecord).toHaveBeenCalled();
  });
});