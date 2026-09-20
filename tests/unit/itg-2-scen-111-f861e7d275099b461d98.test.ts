import { receiveAndRecordWorkPerformanceData } from '../../src/logic/productivity-data-collection';
import { CacheStorageFailureError } from '../../src/errors/CacheStorageFailureError';

// Mock the dependencies
jest.mock('../../src/services/validation', () => ({
  validateInputData: jest.fn(),
}));

jest.mock('../../src/services/worker', () => ({
  findWorkerById: jest.fn(),
}));

jest.mock('../../src/services/workType', () => ({
  findWorkTypeById: jest.fn(),
}));

jest.mock('../../src/services/cache', () => ({
  savePerformanceRecord: jest.fn(),
}));

import { validateInputData } from '../../src/services/validation';
import { findWorkerById } from '../../src/services/worker';
import { findWorkTypeById } from '../../src/services/workType';
import { savePerformanceRecord } from '../../src/services/cache';

describe('SCEN-111: キャッシュ保存に失敗した場合、CacheStorageFailureErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CacheStorageFailureError when cache storage fails', async () => {
    // Arrange
    const input = {
      workerId: 'W001',
      workTypeId: 'WT001',
      completedQuantity: 10,
      requiredTimeMinutes: 30,
      workDate: '2025-01-15',
      departmentId: 'D001',
      teamId: 'T001',
      siteId: 'S001',
      qualityScore: 95,
      errorCount: 0,
      remarks: 'Normal completion',
    };

    // Set up stub validateInputData to succeed
    (validateInputData as jest.Mock).mockReturnValue(true);

    // Set up stub findWorkerById to succeed
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      siteId: 'S001',
      teamId: 'T001',
    });

    // Set up stub findWorkTypeById to succeed
    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'Test Work Type',
    });

    // Set up stub savePerformanceRecord to throw CacheStorageFailureError
    (savePerformanceRecord as jest.Mock).mockRejectedValue(
      new CacheStorageFailureError('キャッシュへのデータ保存に失敗しました。')
    );

    // Act & Assert
    try {
      await receiveAndRecordWorkPerformanceData(input);
      fail('Should have thrown CacheStorageFailureError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(CacheStorageFailureError);
      expect(error.name).toBe('CacheStorageFailureError');
      expect(error.message).toBe('キャッシュへのデータ保存に失敗しました。');
    }
  });
});