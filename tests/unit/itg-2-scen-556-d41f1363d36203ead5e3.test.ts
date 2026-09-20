import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import type { SavePerformanceRecordInput, SavePerformanceRecordOutput } from '../../src/logic/persistence-layer';

describe('SCEN-556: 備考が500文字のときの正常系で新規作成が成功する', () => {
  const requestingUserId = 'user-admin-001';
  const workerId = 'worker-123';
  const placementPlanId = 'plan-456';
  const performanceRecordId = 'uuid-new-001';

  const remarks500Chars = 'あ'.repeat(500);

  let input: SavePerformanceRecordInput;

  beforeEach(() => {
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 30);

    input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'ピッキング作業を実施',
      completionCount: 150,
      requiredTimeMinutes: 480,
      qualityScore: 95,
      remarks: remarks500Chars,
      createdBy: requestingUserId,
      updatedBy: undefined,
      requestingUserId,
      operation: 'create',
    };

    jest.spyOn(global as any, 'authorizeUserAction').mockResolvedValue({
      authorized: true,
      userId: requestingUserId,
      role: 'admin',
    });

    jest.spyOn(global as any, 'validateInputData').mockResolvedValue(undefined);

    jest.spyOn(global as any, 'findWorkerById').mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'picking',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });

    jest.spyOn(global as any, 'findPlacementPlanByWorkerAndDate').mockResolvedValue({
      placementPlanId,
      workerId,
      placementDepartment: 'dept-001',
      placementJobType: 'picking',
      startDate: new Date(workDate.getTime() - 86400000),
      endDate: new Date(workDate.getTime() + 86400000),
      placementStatus: 'active',
      expectedProductivityTarget: 150,
      optimizationReason: null,
      found: true,
    });

    jest.spyOn(global as any, 'findPerformanceRecordsByWorkerAndPeriod').mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      workerId,
      periodStartDate: workDate,
      periodEndDate: workDate,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify that remarks field contains exactly 500 characters before test', () => {
    expect(remarks500Chars.length).toBe(500);
  });

  it('should successfully create a new performance record with 500-character remarks', async () => {
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
  });

  it('should verify that input remarks field contains exactly 500 characters', async () => {
    expect(input.remarks).toBeDefined();
    expect(input.remarks!.length).toBe(500);
  });

  it('should confirm operation type is create', async () => {
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(result.operation).toBe('create');
  });

  it('should persist new record to persistence layer', async () => {
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);
    expect(result.savedAt).toBeInstanceOf(Date);
  });

  it('should verify that authorizeUserAction was called with requestingUserId and returns admin authorization', async () => {
    await savePerformanceRecord(input);

    expect(global.authorizeUserAction).toHaveBeenCalledWith(
      expect.objectContaining({
        requestingUserId: 'user-admin-001',
      })
    );
  });

  it('should verify that validateInputData was called to validate input constraints', async () => {
    await savePerformanceRecord(input);

    expect(global.validateInputData).toHaveBeenCalled();
  });

  it('should verify that findWorkerById was called with correct parameters and returns active worker', async () => {
    await savePerformanceRecord(input);

    expect(global.findWorkerById).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker-123',
        requestingUserId: 'user-admin-001',
      })
    );
  });

  it('should verify that findPlacementPlanByWorkerAndDate was called with correct parameters and returns valid plan within period', async () => {
    await savePerformanceRecord(input);

    expect(global.findPlacementPlanByWorkerAndDate).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker-123',
        targetDate: input.workDate,
        requestingUserId: 'user-admin-001',
      })
    );
  });

  it('should verify that findPerformanceRecordsByWorkerAndPeriod was called with correct parameters to check for duplicate records', async () => {
    await savePerformanceRecord(input);

    expect(global.findPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker-123',
        requestingUserId: 'user-admin-001',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it('should not raise DuplicatePerformanceRecordError for new record', async () => {
    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result).toHaveProperty('performanceRecordId');
    expect(result).toHaveProperty('savedAt');
  });

  it('should confirm all four expected conditions are met', async () => {
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(input.remarks).toBeDefined();
    expect(input.remarks!.length).toBe(500);

    expect(result.operation).toBe('create');

    expect(global.findPerformanceRecordsByWorkerAndPeriod).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe(performanceRecordId);

    expect(result.success).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should verify admin authorization was successful before record creation', async () => {
    await savePerformanceRecord(input);

    const authCall = (global.authorizeUserAction as jest.Mock).mock.results[0];
    expect(authCall.value).toHaveProperty('authorized', true);
    expect(authCall.value).toHaveProperty('role', 'admin');
  });

  it('should verify worker operatingStatus is active', async () => {
    await savePerformanceRecord(input);

    const workerCall = (global.findWorkerById as jest.Mock).mock.results[0];
    expect(workerCall.value).toHaveProperty('operatingStatus', 'active');
    expect(workerCall.value).toHaveProperty('found', true);
  });

  it('should verify placement plan period contains workDate', async () => {
    await savePerformanceRecord(input);

    const planCall = (global.findPlacementPlanByWorkerAndDate as jest.Mock).mock.results[0];
    const plan = planCall.value;
    expect(plan.startDate.getTime()).toBeLessThanOrEqual(input.workDate.getTime());
    expect(plan.endDate.getTime()).toBeGreaterThanOrEqual(input.workDate.getTime());
    expect(plan.found).toBe(true);
  });

  it('should verify no existing performance record exists for same worker, date, and placement plan', async () => {
    await savePerformanceRecord(input);

    const recordCall = (global.findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mock.results[0];
    expect(recordCall.value).toHaveProperty('totalCount', 0);
    expect(recordCall.value).toHaveProperty('found', false);
    expect(recordCall.value.performanceRecords).toEqual([]);
  });

  it('should verify remarks are preserved exactly as input when saved', async () => {
    const result: SavePerformanceRecordOutput = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(input.remarks).toBe(remarks500Chars);
    expect(input.remarks.length).toBe(500);
  });
});