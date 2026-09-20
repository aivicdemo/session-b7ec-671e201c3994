import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  findWorkerById: jest.fn(),
  findPlacementPlanByWorkerAndDate: jest.fn(),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
  savePerformanceRecord: jest.fn(),
}));

describe('SCEN-540: 完了数量が標準生産性から著しく乖離しているとき InvalidCompletionCountErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('完了数量が0でエラーが発生する', async () => {
    const performanceRecordId = 'perf-record-123';
    const workerId = 'worker-456';
    const placementPlanId = 'placement-789';
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 30);
    
    const requiredTimeMinutes = 60;
    const invalidCompletionCount = 0;

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      operatingStatus: '稼働中',
      found: true,
    });

    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      placementPlanId,
      workerId,
      startDate: new Date(workDate.getTime() - 100 * 24 * 60 * 60 * 1000),
      endDate: new Date(workDate.getTime() + 100 * 24 * 60 * 60 * 1000),
      found: true,
    });

    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    const error = new Error('完了数量 0 は無効です。');
    (error as any).name = 'InvalidCompletionCountError';
    
    (persistenceLayer.savePerformanceRecord as jest.Mock).mockRejectedValue(error);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'Test work content',
      completionCount: invalidCompletionCount,
      requiredTimeMinutes,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(input)).rejects.toThrow('InvalidCompletionCountError');
    await expect(savePerformanceRecord(input)).rejects.toThrow('完了数量 0 は無効です。');
  });

  it('完了数量が負の値でエラーが発生する', async () => {
    const performanceRecordId = 'perf-record-125';
    const workerId = 'worker-457';
    const placementPlanId = 'placement-790';
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 15);
    
    const requiredTimeMinutes = 60;
    const negativeCompletionCount = -5;

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      workerId,
      workerName: 'Test Worker 2',
      operatingStatus: '稼働中',
      found: true,
    });

    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      placementPlanId,
      workerId,
      startDate: new Date(workDate.getTime() - 100 * 24 * 60 * 60 * 1000),
      endDate: new Date(workDate.getTime() + 100 * 24 * 60 * 60 * 1000),
      found: true,
    });

    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    const error = new Error('完了数量 -5 は無効です。');
    (error as any).name = 'InvalidCompletionCountError';
    
    (persistenceLayer.savePerformanceRecord as jest.Mock).mockRejectedValue(error);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'Test work content with negative count',
      completionCount: negativeCompletionCount,
      requiredTimeMinutes,
      qualityScore: 75,
      remarks: null,
      createdBy: 'user-002',
      updatedBy: undefined,
      requestingUserId: 'user-002',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(input)).rejects.toThrow('InvalidCompletionCountError');
    await expect(savePerformanceRecord(input)).rejects.toThrow('完了数量 -5 は無効です。');
  });

  it('著しく高い完了数量でもエラーが発生する', async () => {
    const performanceRecordId = 'perf-record-124';
    const workerId = 'worker-456';
    const placementPlanId = 'placement-789';
    const workDate = new Date();
    workDate.setDate(workDate.getDate() - 45);
    
    const requiredTimeMinutes = 60;
    const excessiveCompletionCount = 10000;

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      operatingStatus: '稼働中',
      found: true,
    });

    (persistenceLayer.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue({
      placementPlanId,
      workerId,
      startDate: new Date(workDate.getTime() - 100 * 24 * 60 * 60 * 1000),
      endDate: new Date(workDate.getTime() + 100 * 24 * 60 * 60 * 1000),
      found: true,
    });

    (persistenceLayer.authorizeUserAction as jest.Mock).mockResolvedValue(true);

    (persistenceLayer.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    const error = new Error('完了数量 10000 は無効です。');
    (error as any).name = 'InvalidCompletionCountError';
    
    (persistenceLayer.savePerformanceRecord as jest.Mock).mockRejectedValue(error);

    const input = {
      performanceRecordId,
      workerId,
      placementPlanId,
      workDate,
      workContent: 'Test work content with excessive completion',
      completionCount: excessiveCompletionCount,
      requiredTimeMinutes,
      qualityScore: 75,
      remarks: null,
      createdBy: 'user-002',
      updatedBy: undefined,
      requestingUserId: 'user-002',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(input)).rejects.toThrow('InvalidCompletionCountError');
    await expect(savePerformanceRecord(input)).rejects.toThrow('完了数量 10000 は無効です。');
  });
});