import { recordWorkExecutionStart } from '../../src/logic/work-execution-tracking';
import * as workExecutionTracking from '../../src/logic/work-execution-tracking';

describe('SCEN-300: instructionIdが任意項目の場合、省略した入力でも正常に作業開始を記録できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully record work execution start when instructionId is omitted', async () => {
    // Setup stubs for dependencies
    const mockFindWorkerById = jest.spyOn(workExecutionTracking, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
    });

    const mockFindWorkTypeById = jest.spyOn(workExecutionTracking, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Assembly',
    });

    const mockSaveProductivityData = jest
      .spyOn(workExecutionTracking, 'saveProductivityData' as any)
      .mockResolvedValue({
        productivityDataId: 'PD-20240115-001',
        workerId: 'W001',
        executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
        dashboardReflectionStatus: 'pending',
        recordedAt: new Date('2024-01-15T09:00:00Z'),
      });

    const mockSynchronizeDataWithWESAndWMS = jest
      .spyOn(workExecutionTracking, 'synchronizeDataWithWESAndWMS' as any)
      .mockResolvedValue({
        status: 'pending',
      });

    // Prepare input without instructionId
    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      targetProductId: 'P001',
      executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
      scheduledCompletionDateTime: new Date('2024-01-15T10:30:00Z'),
      instructionId: undefined,
    };

    // Call the function directly
    const result = await recordWorkExecutionStart(input);

    // Verify result contains productivityDataId with non-empty unique identifier
    expect(result.productivityDataId).toBeTruthy();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.productivityDataId).toBe('PD-20240115-001');

    // Verify workerId is recorded correctly
    expect(result.workerId).toBe('W001');

    // Verify executionStartDateTime is recorded correctly
    expect(result.executionStartDateTime).toEqual(new Date('2024-01-15T09:00:00Z'));

    // Verify dashboardReflectionStatus is set to pending or reflected
    expect(['pending', 'reflected', 'delayed']).toContain(result.dashboardReflectionStatus);
    expect(result.dashboardReflectionStatus).toBe('pending');

    // Verify recordedAt is in valid ISO 8601 format
    expect(result.recordedAt).toBeInstanceOf(Date);
    const recordedAtISO = result.recordedAt.toISOString();
    expect(recordedAtISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // Verify findWorkerById was called with correct arguments
    expect(mockFindWorkerById).toHaveBeenCalledWith({ workerId: 'W001' });
    expect(mockFindWorkerById).toHaveBeenCalledTimes(1);

    // Verify findWorkTypeById was called with correct arguments
    expect(mockFindWorkTypeById).toHaveBeenCalledWith({ workTypeId: 'WT001' });
    expect(mockFindWorkTypeById).toHaveBeenCalledTimes(1);

    // Verify saveProductivityData was called with instructionId excluded or undefined
    expect(mockSaveProductivityData).toHaveBeenCalled();
    const saveProductivityDataCall = mockSaveProductivityData.mock.calls[0][0];
    expect(saveProductivityDataCall.instructionId).toBeUndefined();

    // Verify saveProductivityData was called with all mandatory fields
    expect(saveProductivityDataCall.workerId).toBe('W001');
    expect(saveProductivityDataCall.workTypeId).toBe('WT001');
    expect(saveProductivityDataCall.targetProductId).toBe('P001');
    expect(saveProductivityDataCall.executionStartDateTime).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(saveProductivityDataCall.scheduledCompletionDateTime).toEqual(new Date('2024-01-15T10:30:00Z'));

    // Cleanup
    mockFindWorkerById.mockRestore();
    mockFindWorkTypeById.mockRestore();
    mockSaveProductivityData.mockRestore();
    mockSynchronizeDataWithWESAndWMS.mockRestore();
  });

  it('should not fail when instructionId is omitted', async () => {
    // Setup stubs for dependencies
    const mockFindWorkerById = jest.spyOn(workExecutionTracking, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
    });

    const mockFindWorkTypeById = jest.spyOn(workExecutionTracking, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Assembly',
    });

    const mockSaveProductivityData = jest
      .spyOn(workExecutionTracking, 'saveProductivityData' as any)
      .mockResolvedValue({
        productivityDataId: 'PD-20240115-001',
        workerId: 'W001',
        executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
        dashboardReflectionStatus: 'pending',
        recordedAt: new Date('2024-01-15T09:00:00Z'),
      });

    const mockSynchronizeDataWithWESAndWMS = jest
      .spyOn(workExecutionTracking, 'synchronizeDataWithWESAndWMS' as any)
      .mockResolvedValue({
        status: 'pending',
      });

    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      targetProductId: 'P001',
      executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
      scheduledCompletionDateTime: new Date('2024-01-15T10:30:00Z'),
      instructionId: undefined,
    };

    const result = await recordWorkExecutionStart(input);

    expect(result).toBeDefined();
    expect(result.productivityDataId).toBeTruthy();
    expect(result.workerId).toBe('W001');

    // Cleanup
    mockFindWorkerById.mockRestore();
    mockFindWorkTypeById.mockRestore();
    mockSaveProductivityData.mockRestore();
    mockSynchronizeDataWithWESAndWMS.mockRestore();
  });

  it('should persist all mandatory fields correctly when instructionId is omitted', async () => {
    // Setup stubs for dependencies
    const mockFindWorkerById = jest.spyOn(workExecutionTracking, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
    });

    const mockFindWorkTypeById = jest.spyOn(workExecutionTracking, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Assembly',
    });

    const mockSaveProductivityData = jest
      .spyOn(workExecutionTracking, 'saveProductivityData' as any)
      .mockResolvedValue({
        productivityDataId: 'PD-20240115-001',
        workerId: 'W001',
        workTypeId: 'WT001',
        targetProductId: 'P001',
        executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
        scheduledCompletionDateTime: new Date('2024-01-15T10:30:00Z'),
        dashboardReflectionStatus: 'pending',
        recordedAt: new Date('2024-01-15T09:00:00Z'),
      });

    const mockSynchronizeDataWithWESAndWMS = jest
      .spyOn(workExecutionTracking, 'synchronizeDataWithWESAndWMS' as any)
      .mockResolvedValue({
        status: 'pending',
      });

    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      targetProductId: 'P001',
      executionStartDateTime: new Date('2024-01-15T09:00:00Z'),
      scheduledCompletionDateTime: new Date('2024-01-15T10:30:00Z'),
      instructionId: undefined,
    };

    const result = await recordWorkExecutionStart(input);

    expect(result.workerId).toBe('W001');
    expect(result.executionStartDateTime).toEqual(input.executionStartDateTime);
    expect(result.productivityDataId).toBeTruthy();
    expect(['pending', 'reflected', 'delayed']).toContain(result.dashboardReflectionStatus);

    // Verify all mandatory fields passed to saveProductivityData
    const saveProductivityDataCall = mockSaveProductivityData.mock.calls[0][0];
    expect(saveProductivityDataCall.workerId).toBe('W001');
    expect(saveProductivityDataCall.workTypeId).toBe('WT001');
    expect(saveProductivityDataCall.targetProductId).toBe('P001');
    expect(saveProductivityDataCall.executionStartDateTime).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(saveProductivityDataCall.scheduledCompletionDateTime).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(saveProductivityDataCall.instructionId).toBeUndefined();

    // Cleanup
    mockFindWorkerById.mockRestore();
    mockFindWorkTypeById.mockRestore();
    mockSaveProductivityData.mockRestore();
    mockSynchronizeDataWithWESAndWMS.mockRestore();
  });
});