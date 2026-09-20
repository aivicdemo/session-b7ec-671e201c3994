import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import { SavePerformanceRecordInput } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('SCEN-532: savePerformanceRecord - InvalidWorkerIdError when worker is inactive', () => {
  const mockAuthorizeUserAction = jest.spyOn(authModule, 'authorizeUserAction');
  const mockValidateInputData = jest.spyOn(authModule, 'validateInputData');
  const mockFindWorkerById = jest.spyOn(persistenceModule, 'findWorkerById');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidWorkerIdError when worker is in inactive status', async () => {
    // Prepare valid input data
    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-inactive',
      placementPlanId: 'plan-001',
      workDate: new Date(),
      workContent: '梱包作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    // Set up stubs for authorization
    mockAuthorizeUserAction.mockResolvedValue(undefined);
    mockValidateInputData.mockResolvedValue(undefined);

    // Set up stub for findWorkerById to return inactive worker
    mockFindWorkerById.mockResolvedValue({
      workerId: 'worker-inactive',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'packing',
      operatingStatus: 'inactive',
      hourlyRate: null,
      maxOperatingHours: null,
      found: true,
    });

    // Call the target function and expect InvalidWorkerIdError
    await expect(savePerformanceRecord(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerIdError',
        message: expect.stringContaining(
          '作業者ID worker-inactive が見つからないか、稼働状態が無効です。'
        ),
      })
    );
  });

  it('should throw InvalidWorkerIdError when worker is not found', async () => {
    // Prepare valid input data
    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-inactive',
      placementPlanId: 'plan-001',
      workDate: new Date(),
      workContent: '梱包作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    // Set up stubs for authorization
    mockAuthorizeUserAction.mockResolvedValue(undefined);
    mockValidateInputData.mockResolvedValue(undefined);

    // Set up stub for findWorkerById to return null
    mockFindWorkerById.mockResolvedValue(null);

    // Call the target function and expect InvalidWorkerIdError
    await expect(savePerformanceRecord(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerIdError',
        message: expect.stringContaining(
          '作業者ID worker-inactive が見つからないか、稼働状態が無効です。'
        ),
      })
    );
  });

  it('should throw InvalidWorkerIdError when worker status is suspended', async () => {
    // Prepare valid input data
    const input: SavePerformanceRecordInput = {
      performanceRecordId: 'perf-001',
      workerId: 'worker-inactive',
      placementPlanId: 'plan-001',
      workDate: new Date(),
      workContent: '梱包作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    // Set up stubs for authorization
    mockAuthorizeUserAction.mockResolvedValue(undefined);
    mockValidateInputData.mockResolvedValue(undefined);

    // Set up stub for findWorkerById to return suspended worker
    mockFindWorkerById.mockResolvedValue({
      workerId: 'worker-inactive',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'packing',
      operatingStatus: 'suspended',
      hourlyRate: null,
      maxOperatingHours: null,
      found: true,
    });

    // Call the target function and expect InvalidWorkerIdError
    await expect(savePerformanceRecord(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerIdError',
        message: expect.stringContaining(
          '作業者ID worker-inactive が見つからないか、稼働状態が無効です。'
        ),
      })
    );
  });
});