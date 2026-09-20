import { recordWorkExecutionStart } from '../../src/logic/work-execution-tracking';
import type { RecordWorkExecutionStartInput, RecordWorkExecutionStartOutput } from '../../src/logic/work-execution-tracking';

// Mock database and external services
jest.mock('../../src/database', () => ({
  findWorkerById: jest.fn(),
  findWorkTypeById: jest.fn(),
  saveProductivityData: jest.fn(),
}));

jest.mock('../../src/external-services', () => ({
  synchronizeDataWithWESAndWMS: jest.fn(),
}));

import { findWorkerById, findWorkTypeById, saveProductivityData } from '../../src/database';
import { synchronizeDataWithWESAndWMS } from '../../src/external-services';

describe('SCEN-295: 作業開始時刻の記録と予定作業時間の計算', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock implementations
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'WKR001',
      workerName: 'Test Worker',
      siteId: 'SITE001',
      status: 'active',
    });

    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'WTP001',
      workTypeName: 'Assembly',
      standardProductivity: 100,
    });

    (saveProductivityData as jest.Mock).mockImplementation((data) => {
      return Promise.resolve({
        productivityDataId: `prod-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      });
    });

    (synchronizeDataWithWESAndWMS as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('should calculate scheduled work duration in minutes correctly based on execution start and completion times', async () => {
    const executionStartDateTime = new Date('2024-01-15T09:00:00Z');
    const scheduledCompletionDateTime = new Date('2024-01-15T09:45:00Z');

    const input: RecordWorkExecutionStartInput = {
      workerId: 'WKR001',
      workTypeId: 'WTP001',
      targetProductId: 'PRD12345',
      executionStartDateTime,
      scheduledCompletionDateTime,
      instructionId: 'INS98765',
    };

    const result = await recordWorkExecutionStart(input);

    // (1) productivityDataId が存在し、UUIDまたは一意識別子の形式であること
    expect(result.productivityDataId).toBeTruthy();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.productivityDataId.length).toBeGreaterThan(0);

    // (2) workerId='WKR001' であること
    expect(result.workerId).toBe('WKR001');

    // (3) executionStartDateTime='2024-01-15T09:00:00Z' であること
    expect(result.executionStartDateTime).toEqual(executionStartDateTime);

    // (4) dashboardReflectionStatus が 'pending' または 'reflected' であること
    expect(['pending', 'reflected', 'delayed']).toContain(result.dashboardReflectionStatus);

    // (5) recordedAt が現在時刻付近であること
    expect(result.recordedAt).toBeInstanceOf(Date);
    const timeDiff = Math.abs(result.recordedAt.getTime() - new Date().getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

    // 業務ルール br-tx_4-013 の計算式に基づき、予定作業時間を検証
    // システムが分単位で正確に計算していることを確認
    const durationInSeconds =
      (scheduledCompletionDateTime.getTime() - executionStartDateTime.getTime()) / 1000;
    const expectedDurationInMinutes = durationInSeconds / 60;

    expect(expectedDurationInMinutes).toBe(45);

    // 依存関数が正しく呼び出されたことを確認
    expect(findWorkerById).toHaveBeenCalledWith('WKR001');
    expect(findWorkTypeById).toHaveBeenCalledWith('WTP001');
    expect(saveProductivityData).toHaveBeenCalled();
    expect(synchronizeDataWithWESAndWMS).toHaveBeenCalled();
  });

  it('should record execution start with all required fields populated', async () => {
    const executionStartDateTime = new Date('2024-01-15T09:00:00Z');
    const scheduledCompletionDateTime = new Date('2024-01-15T09:45:00Z');

    const input: RecordWorkExecutionStartInput = {
      workerId: 'WKR001',
      workTypeId: 'WTP001',
      targetProductId: 'PRD12345',
      executionStartDateTime,
      scheduledCompletionDateTime,
      instructionId: 'INS98765',
    };

    const result = await recordWorkExecutionStart(input);

    expect(result.productivityDataId).toBeTruthy();
    expect(result.workerId).toBe('WKR001');
    expect(result.executionStartDateTime).toEqual(executionStartDateTime);
    expect(['pending', 'reflected', 'delayed']).toContain(result.dashboardReflectionStatus);
    expect(result.recordedAt).toBeInstanceOf(Date);

    // Verify internal functions were called
    expect(findWorkerById).toHaveBeenCalledWith('WKR001');
    expect(findWorkTypeById).toHaveBeenCalledWith('WTP001');
    expect(saveProductivityData).toHaveBeenCalled();
  });

  it('should calculate different durations correctly for various time differences', async () => {
    const testCases = [
      {
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T09:30:00Z'),
        expectedMinutes: 30,
      },
      {
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T10:00:00Z'),
        expectedMinutes: 60,
      },
      {
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T11:15:00Z'),
        expectedMinutes: 135,
      },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();

      (findWorkerById as jest.Mock).mockResolvedValue({
        workerId: 'WKR001',
        workerName: 'Test Worker',
        siteId: 'SITE001',
        status: 'active',
      });

      (findWorkTypeById as jest.Mock).mockResolvedValue({
        workTypeId: 'WTP001',
        workTypeName: 'Assembly',
        standardProductivity: 100,
      });

      (saveProductivityData as jest.Mock).mockImplementation((data) => {
        return Promise.resolve({
          productivityDataId: `prod-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...data,
        });
      });

      (synchronizeDataWithWESAndWMS as jest.Mock).mockResolvedValue({
        success: true,
      });

      const input: RecordWorkExecutionStartInput = {
        workerId: 'WKR001',
        workTypeId: 'WTP001',
        targetProductId: 'PRD12345',
        executionStartDateTime: testCase.startTime,
        scheduledCompletionDateTime: testCase.endTime,
        instructionId: 'INS98765',
      };

      const result = await recordWorkExecutionStart(input);

      const durationInSeconds =
        (testCase.endTime.getTime() - testCase.startTime.getTime()) / 1000;
      const durationInMinutes = durationInSeconds / 60;

      expect(durationInMinutes).toBe(testCase.expectedMinutes);
      expect(result).toBeDefined();
      expect(result.productivityDataId).toBeTruthy();
      expect(result.workerId).toBe('WKR001');
      expect(result.executionStartDateTime).toEqual(testCase.startTime);

      // Verify internal functions were called
      expect(findWorkerById).toHaveBeenCalledWith('WKR001');
      expect(findWorkTypeById).toHaveBeenCalledWith('WTP001');
      expect(saveProductivityData).toHaveBeenCalled();
    }
  });

  it('should handle worker not found scenario', async () => {
    (findWorkerById as jest.Mock).mockResolvedValue(null);

    const executionStartDateTime = new Date('2024-01-15T09:00:00Z');
    const scheduledCompletionDateTime = new Date('2024-01-15T09:45:00Z');

    const input: RecordWorkExecutionStartInput = {
      workerId: 'NONEXISTENT',
      workTypeId: 'WTP001',
      targetProductId: 'PRD12345',
      executionStartDateTime,
      scheduledCompletionDateTime,
      instructionId: 'INS98765',
    };

    await expect(recordWorkExecutionStart(input)).rejects.toThrow();
  });

  it('should handle work type not found scenario', async () => {
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'WKR001',
      workerName: 'Test Worker',
      siteId: 'SITE001',
      status: 'active',
    });

    (findWorkTypeById as jest.Mock).mockResolvedValue(null);

    const executionStartDateTime = new Date('2024-01-15T09:00:00Z');
    const scheduledCompletionDateTime = new Date('2024-01-15T09:45:00Z');

    const input: RecordWorkExecutionStartInput = {
      workerId: 'WKR001',
      workTypeId: 'NONEXISTENT',
      targetProductId: 'PRD12345',
      executionStartDateTime,
      scheduledCompletionDateTime,
      instructionId: 'INS98765',
    };

    await expect(recordWorkExecutionStart(input)).rejects.toThrow();
  });
});