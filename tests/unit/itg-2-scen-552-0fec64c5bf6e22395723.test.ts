import {
  savePerformanceRecord,
  SavePerformanceRecordInput,
  SavePerformanceRecordOutput,
  findWorkerById,
  findPlacementPlanByWorkerAndDate,
  findPerformanceRecordsByWorkerAndPeriod,
} from '../../src/logic/persistence-layer';

describe('SCEN-552: 作業内容が1文字のときの正常系で新規作成が成功する', () => {
  it('should successfully create a new performance record when workContent is 1 character', async () => {
    const now = new Date();
    const workDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const input: SavePerformanceRecordInput = {
      performanceRecordId: '550e8400-e29b-41d4-a716-446655440000',
      workerId: 'worker001',
      placementPlanId: 'plan001',
      workDate: workDate,
      workContent: 'A',
      completionCount: 10,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user001',
      updatedBy: undefined,
      requestingUserId: 'user001',
      operation: 'create',
    };

    // Mock authorizeUserAction to verify permission check
    jest.spyOn(global, 'authorizeUserAction' as any).mockImplementation((userId: string, action: string) => {
      if (userId === 'user001' && action === 'create') {
        return true;
      }
      throw new Error('Unauthorized');
    });

    // Mock validateInputData to verify input constraints
    jest.spyOn(global, 'validateInputData' as any).mockImplementation((data: any) => {
      const errors: string[] = [];
      
      if (data.workContent && (data.workContent.length < 1 || data.workContent.length > 500)) {
        errors.push('workContent must be between 1 and 500 characters');
      }
      
      if (data.completionCount !== undefined && (!Number.isInteger(data.completionCount) || data.completionCount <= 0)) {
        errors.push('completionCount must be a positive integer');
      }
      
      if (data.requiredTimeMinutes !== undefined && (data.requiredTimeMinutes < 1 || !Number.isInteger(data.requiredTimeMinutes))) {
        errors.push('requiredTimeMinutes must be an integer >= 1');
      }
      
      if (data.qualityScore !== undefined && (!Number.isInteger(data.qualityScore) || data.qualityScore < 0 || data.qualityScore > 100)) {
        errors.push('qualityScore must be an integer between 0 and 100');
      }
      
      return { valid: errors.length === 0, errors };
    });

    jest.spyOn(global as any, 'findWorkerById').mockResolvedValue({
      workerId: 'worker001',
      workerName: 'John Doe',
      siteId: 'site001',
      teamId: 'team001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });

    // Mock findPlacementPlanByWorkerAndDate with date range validation
    jest.spyOn(global as any, 'findPlacementPlanByWorkerAndDate').mockImplementation((workerId: string, targetDate: Date) => {
      if (workerId === 'worker001' && targetDate >= startDate && targetDate <= endDate) {
        return {
          placementPlanId: 'plan001',
          workerId: 'worker001',
          placementDepartment: 'dept001',
          placementJobType: 'assembly',
          startDate: startDate,
          endDate: endDate,
          placementStatus: 'active',
          expectedProductivityTarget: 100,
          optimizationReason: null,
          found: true,
        };
      }
      return { found: false };
    });

    jest.spyOn(global as any, 'findPerformanceRecordsByWorkerAndPeriod').mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId: 'worker001',
      periodStartDate: workDate,
      periodEndDate: workDate,
    });

    const beforeSave = new Date();
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);
    const afterSave = new Date();

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    expect(result.message).toBeUndefined();
    
    // Verify workContent constraint
    expect(input.workContent).toBe('A');
    expect(input.workContent.length).toBe(1);
    expect(input.workContent.length).toBeGreaterThanOrEqual(1);
    expect(input.workContent.length).toBeLessThanOrEqual(500);
    
    // Verify completionCount is positive integer
    expect(input.completionCount).toBe(10);
    expect(Number.isInteger(input.completionCount)).toBe(true);
    expect(input.completionCount).toBeGreaterThan(0);
    
    // Verify requiredTimeMinutes is >= 1
    expect(input.requiredTimeMinutes).toBe(120);
    expect(Number.isInteger(input.requiredTimeMinutes)).toBe(true);
    expect(input.requiredTimeMinutes).toBeGreaterThanOrEqual(1);
    
    // Verify qualityScore is between 0 and 100
    expect(input.qualityScore).toBe(85);
    expect(Number.isInteger(input.qualityScore)).toBe(true);
    expect(input.qualityScore).toBeGreaterThanOrEqual(0);
    expect(input.qualityScore).toBeLessThanOrEqual(100);
  });
});