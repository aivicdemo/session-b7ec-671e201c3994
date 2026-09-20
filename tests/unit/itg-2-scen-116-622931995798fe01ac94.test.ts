import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';
import * as productivityModule from '../../src/logic/productivity-data-collection';

describe('SCEN-116: receiveAndRecordWorkPerformanceData with optional fields', () => {
  let validateInputDataSpy: jest.SpyInstance;
  let findWorkerByIdSpy: jest.SpyInstance;
  let findWorkTypeByIdSpy: jest.SpyInstance;
  let savePerformanceRecordSpy: jest.SpyInstance;
  let validateAndRetryRealtimeDataTransmissionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    validateInputDataSpy = jest.spyOn(productivityModule, 'validateInputData' as any).mockResolvedValue(true);
    findWorkerByIdSpy = jest.spyOn(productivityModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'W001',
      name: 'Worker One',
      status: 'active',
    });
    findWorkTypeByIdSpy = jest.spyOn(productivityModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'WT-PICK',
      name: 'Picking',
      difficultyLevel: 2,
    });
    savePerformanceRecordSpy = jest.spyOn(productivityModule, 'savePerformanceRecord' as any).mockResolvedValue({
      performanceRecordId: 'PERF-REC-20240115-001',
      recordedAt: '2024-01-15T14:30:45Z',
    });
    validateAndRetryRealtimeDataTransmissionSpy = jest.spyOn(productivityModule, 'validateAndRetryRealtimeDataTransmission' as any).mockResolvedValue({
      action: 'proceed',
      elapsedTimeMs: 2000,
      allowedDelayMs: 5000,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correctly save performance record with all optional fields included', async () => {
    const input = {
      workerId: 'W001',
      workTypeId: 'WT-PICK',
      completedQuantity: 50,
      requiredTimeMinutes: 120,
      workDate: '2024-01-15',
      departmentId: 'D-WEST',
      teamId: 'T-TEAM-A',
      siteId: 'SITE-001',
      qualityScore: 85,
      errorCount: 2,
      remarks: '作業完了、品質確認済み',
    };

    const output = await receiveAndRecordWorkPerformanceData(input);

    expect(output.performanceRecordId).toBe('PERF-REC-20240115-001');
    expect(output.recordedAt).toBe('2024-01-15T14:30:45Z');
    expect(output.cacheStatus).toBe('cached');
    expect(output.transmissionStatus).toBe('pending');
    expect(output.retryCount).toBeUndefined();
    expect(output.notificationSent).toBe(false);
    expect(output.productivityMetrics).toBeDefined();
    expect(typeof output.productivityMetrics?.productivityRate).toBe('number');
    expect(typeof output.productivityMetrics?.estimatedCompletionTime).toBe('number');

    expect(validateInputDataSpy).toHaveBeenCalledWith(input);
    expect(findWorkerByIdSpy).toHaveBeenCalledWith('W001');
    expect(findWorkTypeByIdSpy).toHaveBeenCalledWith('WT-PICK');

    expect(savePerformanceRecordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'W001',
        workTypeId: 'WT-PICK',
        completedQuantity: 50,
        requiredTimeMinutes: 120,
        workDate: '2024-01-15',
        departmentId: 'D-WEST',
        teamId: 'T-TEAM-A',
        siteId: 'SITE-001',
        qualityScore: 85,
        errorCount: 2,
        remarks: '作業完了、品質確認済み',
      })
    );

    expect(validateAndRetryRealtimeDataTransmissionSpy).toHaveBeenCalled();
  });
});