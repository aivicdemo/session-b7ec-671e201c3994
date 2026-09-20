import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import type {
  SavePerformanceRecordInput,
  SavePerformanceRecordOutput,
} from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-554: 備考がnullのときの正常系で新規作成が成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a new performance record when remarks is null', async () => {
    const today = new Date();
    const workDate = new Date(today);
    workDate.setDate(today.getDate() - 30);

    const authorizeUserActionSpy = jest
      .spyOn(persistenceLayer as any, 'authorizeUserAction')
      .mockResolvedValue({ authorized: true });

    const validateInputDataSpy = jest
      .spyOn(persistenceLayer as any, 'validateInputData')
      .mockResolvedValue({ valid: true });

    const findWorkerByIdSpy = jest
      .spyOn(persistenceLayer as any, 'findWorkerById')
      .mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        siteId: 'site-001',
        teamId: 'team-001',
        jobType: 'assembly',
        operatingStatus: '稼働中',
        found: true,
      });

    const findPlacementPlanSpy = jest
      .spyOn(persistenceLayer as any, 'findPlacementPlanByWorkerAndDate')
      .mockResolvedValue({
        placementPlanId: 'placement-001',
        workerId: 'worker-001',
        placementDepartment: 'Department A',
        placementJobType: 'assembly',
        startDate: new Date(workDate.getTime() - 86400000),
        endDate: new Date(workDate.getTime() + 86400000),
        placementStatus: 'active',
        expectedProductivityTarget: 100,
        found: true,
      });

    const findPerformanceRecordsSpy = jest
      .spyOn(persistenceLayer as any, 'findPerformanceRecordsByWorkerAndPeriod')
      .mockResolvedValue({
        performanceRecords: [],
        totalCount: 0,
        found: false,
        workerId: 'worker-001',
        periodStartDate: workDate,
        periodEndDate: workDate,
      });

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-rec-001',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate: workDate,
      workContent: '実施した作業の内容説明',
      completionCount: 5,
      requiredTimeMinutes: 120,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('perf-rec-001');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(
      result.message === undefined || typeof result.message === 'string'
    ).toBe(true);

    expect(authorizeUserActionSpy).toHaveBeenCalledTimes(1);
    expect(validateInputDataSpy).toHaveBeenCalledTimes(1);
    expect(findWorkerByIdSpy).toHaveBeenCalledTimes(1);
    expect(findPlacementPlanSpy).toHaveBeenCalledTimes(1);
    expect(findPerformanceRecordsSpy).toHaveBeenCalledTimes(1);

    const daysDifference = Math.floor(
      (today.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBeLessThanOrEqual(90);
    expect(daysDifference).toBeGreaterThanOrEqual(0);

    authorizeUserActionSpy.mockRestore();
    validateInputDataSpy.mockRestore();
    findWorkerByIdSpy.mockRestore();
    findPlacementPlanSpy.mockRestore();
    findPerformanceRecordsSpy.mockRestore();
  });

  it('should handle null remarks without affecting the creation process', async () => {
    const today = new Date();
    const workDate = new Date(today);
    workDate.setDate(today.getDate() - 15);

    const authorizeUserActionSpy = jest
      .spyOn(persistenceLayer as any, 'authorizeUserAction')
      .mockResolvedValue({ authorized: true });

    const validateInputDataSpy = jest
      .spyOn(persistenceLayer as any, 'validateInputData')
      .mockResolvedValue({ valid: true });

    const findWorkerByIdSpy = jest
      .spyOn(persistenceLayer as any, 'findWorkerById')
      .mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        siteId: 'site-001',
        teamId: 'team-001',
        jobType: 'assembly',
        operatingStatus: '稼働中',
        found: true,
      });

    const findPlacementPlanSpy = jest
      .spyOn(persistenceLayer as any, 'findPlacementPlanByWorkerAndDate')
      .mockResolvedValue({
        placementPlanId: 'placement-001',
        workerId: 'worker-001',
        placementDepartment: 'Department A',
        placementJobType: 'assembly',
        startDate: new Date(workDate.getTime() - 86400000),
        endDate: new Date(workDate.getTime() + 86400000),
        placementStatus: 'active',
        expectedProductivityTarget: 100,
        found: true,
      });

    const findPerformanceRecordsSpy = jest
      .spyOn(persistenceLayer as any, 'findPerformanceRecordsByWorkerAndPeriod')
      .mockResolvedValue({
        performanceRecords: [],
        totalCount: 0,
        found: false,
        workerId: 'worker-001',
        periodStartDate: workDate,
        periodEndDate: workDate,
      });

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-rec-002',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate: workDate,
      workContent: 'Assembly task completion',
      completionCount: 10,
      requiredTimeMinutes: 240,
      qualityScore: 90,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.performanceRecordId).toBe('perf-rec-002');
    expect(
      result.message === undefined || typeof result.message === 'string'
    ).toBe(true);

    expect(authorizeUserActionSpy).toHaveBeenCalledTimes(1);
    expect(validateInputDataSpy).toHaveBeenCalledTimes(1);
    expect(findWorkerByIdSpy).toHaveBeenCalledTimes(1);
    expect(findPlacementPlanSpy).toHaveBeenCalledTimes(1);
    expect(findPerformanceRecordsSpy).toHaveBeenCalledTimes(1);

    const daysDifference = Math.floor(
      (today.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBeLessThanOrEqual(90);

    authorizeUserActionSpy.mockRestore();
    validateInputDataSpy.mockRestore();
    findWorkerByIdSpy.mockRestore();
    findPlacementPlanSpy.mockRestore();
    findPerformanceRecordsSpy.mockRestore();
  });

  it('should preserve other valid fields when remarks is null', async () => {
    const today = new Date();
    const workDate = new Date(today);
    workDate.setDate(today.getDate() - 45);

    const authorizeUserActionSpy = jest
      .spyOn(persistenceLayer as any, 'authorizeUserAction')
      .mockResolvedValue({ authorized: true });

    const validateInputDataSpy = jest
      .spyOn(persistenceLayer as any, 'validateInputData')
      .mockResolvedValue({ valid: true });

    const findWorkerByIdSpy = jest
      .spyOn(persistenceLayer as any, 'findWorkerById')
      .mockResolvedValue({
        workerId: 'worker-001',
        workerName: 'Test Worker',
        siteId: 'site-001',
        teamId: 'team-001',
        jobType: 'quality_inspection',
        operatingStatus: '稼働中',
        found: true,
      });

    const findPlacementPlanSpy = jest
      .spyOn(persistenceLayer as any, 'findPlacementPlanByWorkerAndDate')
      .mockResolvedValue({
        placementPlanId: 'placement-001',
        workerId: 'worker-001',
        placementDepartment: 'Department A',
        placementJobType: 'quality_inspection',
        startDate: new Date(workDate.getTime() - 86400000),
        endDate: new Date(workDate.getTime() + 86400000),
        placementStatus: 'active',
        expectedProductivityTarget: 100,
        found: true,
      });

    const findPerformanceRecordsSpy = jest
      .spyOn(persistenceLayer as any, 'findPerformanceRecordsByWorkerAndPeriod')
      .mockResolvedValue({
        performanceRecords: [],
        totalCount: 0,
        found: false,
        workerId: 'worker-001',
        periodStartDate: workDate,
        periodEndDate: workDate,
      });

    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-rec-003',
      workerId: 'worker-001',
      placementPlanId: 'placement-001',
      workDate: workDate,
      workContent: 'Quality inspection work',
      completionCount: 25,
      requiredTimeMinutes: 360,
      qualityScore: 95,
      remarks: null,
      createdBy: 'user-002',
      updatedBy: undefined,
      requestingUserId: 'user-002',
      operation: 'create',
    };

    const result = await savePerformanceRecord(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('perf-rec-003');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(
      result.message === undefined || typeof result.message === 'string'
    ).toBe(true);

    expect(authorizeUserActionSpy).toHaveBeenCalledTimes(1);
    expect(validateInputDataSpy).toHaveBeenCalledTimes(1);
    expect(findWorkerByIdSpy).toHaveBeenCalledTimes(1);
    expect(findPlacementPlanSpy).toHaveBeenCalledTimes(1);
    expect(findPerformanceRecordsSpy).toHaveBeenCalledTimes(1);

    const daysDifference = Math.floor(
      (today.getTime() - workDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBeLessThanOrEqual(90);

    authorizeUserActionSpy.mockRestore();
    validateInputDataSpy.mockRestore();
    findWorkerByIdSpy.mockRestore();
    findPlacementPlanSpy.mockRestore();
    findPerformanceRecordsSpy.mockRestore();
  });
});