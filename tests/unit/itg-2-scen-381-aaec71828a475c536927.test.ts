import { jest } from '@jest/globals';
import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';

// Mock internal dependencies used by submitWorkPerformanceData
jest.mock('../../src/db/worker-repository', () => ({
  findWorkerById: jest.fn(),
}));

jest.mock('../../src/db/department-repository', () => ({
  findDepartmentById: jest.fn(),
}));

jest.mock('../../src/db/work-type-repository', () => ({
  findWorkTypeById: jest.fn(),
}));

jest.mock('../../src/db/performance-record-repository', () => ({
  savePerformanceRecord: jest.fn(),
}));

jest.mock('../../src/auth/authentication', () => ({
  authenticateUser: jest.fn(),
}));

jest.mock('../../src/auth/authorization', () => ({
  authorizeUserAction: jest.fn(),
}));

jest.mock('../../src/validation/input-validator', () => ({
  validateInputData: jest.fn(),
}));

describe('SCEN-381: 指定された作業者IDが存在しないとき、InvalidWorkerErrorが発生する', () => {
  let mockAuthenticateUser: jest.Mock;
  let mockAuthorizeUserAction: jest.Mock;
  let mockValidateInputData: jest.Mock;
  let mockFindWorkerById: jest.Mock;
  let mockFindDepartmentById: jest.Mock;
  let mockFindWorkTypeById: jest.Mock;
  let mockSavePerformanceRecord: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const authModule = require('../../src/auth/authentication');
    const authzModule = require('../../src/auth/authorization');
    const validatorModule = require('../../src/validation/input-validator');
    const workerRepoModule = require('../../src/db/worker-repository');
    const deptRepoModule = require('../../src/db/department-repository');
    const workTypeRepoModule = require('../../src/db/work-type-repository');
    const perfRecordRepoModule = require('../../src/db/performance-record-repository');

    mockAuthenticateUser = authModule.authenticateUser;
    mockAuthorizeUserAction = authzModule.authorizeUserAction;
    mockValidateInputData = validatorModule.validateInputData;
    mockFindWorkerById = workerRepoModule.findWorkerById;
    mockFindDepartmentById = deptRepoModule.findDepartmentById;
    mockFindWorkTypeById = workTypeRepoModule.findWorkTypeById;
    mockSavePerformanceRecord = perfRecordRepoModule.savePerformanceRecord;

    // Setup stubs as per specification
    mockAuthenticateUser.mockResolvedValue({ userId: 'USER001' });
    mockAuthorizeUserAction.mockResolvedValue(true);
    mockValidateInputData.mockResolvedValue({ isValid: true, errors: [] });
    mockFindWorkerById.mockResolvedValue(null); // Worker does not exist
    mockFindDepartmentById.mockResolvedValue({ departmentId: 'DEPT001' });
    mockFindWorkTypeById.mockResolvedValue({ workTypeId: 'WTYPE001' });
    mockSavePerformanceRecord.mockResolvedValue({
      performanceRecordId: 'REC001',
      success: true,
    });
  });

  it('should throw InvalidWorkerError when worker does not exist', async () => {
    const input = {
      userId: 'USER001',
      workerId: 'WORKER_NOT_EXIST',
      departmentId: 'DEPT001',
      workTypeId: 'WTYPE001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: 'テスト作業',
      remarks: 'テスト備考',
    };

    // Call the actual implementation
    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkerError',
        message: '指定された作業者は見つかりません。または稼働状態が無効です。',
      })
    );

    // Verify call sequence and arguments
    expect(mockAuthenticateUser).toHaveBeenCalledWith('USER001');
    expect(mockAuthorizeUserAction).toHaveBeenCalledWith('USER001', expect.any(String));
    expect(mockValidateInputData).toHaveBeenCalledWith(input);
    expect(mockFindWorkerById).toHaveBeenCalledWith('WORKER_NOT_EXIST');
    
    // Verify that subsequent operations were not called
    expect(mockFindDepartmentById).not.toHaveBeenCalled();
    expect(mockFindWorkTypeById).not.toHaveBeenCalled();
    expect(mockSavePerformanceRecord).not.toHaveBeenCalled();
  });
});