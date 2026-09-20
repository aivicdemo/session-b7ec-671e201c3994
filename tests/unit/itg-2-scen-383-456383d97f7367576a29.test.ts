import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import * as workPerformanceModule from '../../src/logic/work-performance-data-input';

jest.mock('../../src/logic/work-performance-data-input', () => {
  const actualModule = jest.requireActual('../../src/logic/work-performance-data-input');
  return {
    ...actualModule,
    authenticateUser: jest.fn(),
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findWorkerById: jest.fn(),
    findDepartmentById: jest.fn(),
    findWorkTypeById: jest.fn(),
    savePerformanceRecord: jest.fn(),
    submitWorkPerformanceData: actualModule.submitWorkPerformanceData,
  };
});

describe('SCEN-383: submitWorkPerformanceData - InvalidWorkTypeError handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (workPerformanceModule.authenticateUser as jest.Mock).mockResolvedValue({
      userId: 'user001',
      isAuthenticated: true,
    });

    (workPerformanceModule.authorizeUserAction as jest.Mock).mockResolvedValue({
      userId: 'user001',
      hasPermission: true,
      action: 'work_performance_input',
    });

    (workPerformanceModule.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    (workPerformanceModule.findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker001',
      workerName: 'Test Worker',
      status: '稼働中',
      departmentId: 'dept001',
    });

    (workPerformanceModule.findDepartmentById as jest.Mock).mockResolvedValue({
      departmentId: 'dept001',
      departmentName: 'Test Department',
      status: '有効',
    });

    (workPerformanceModule.findWorkTypeById as jest.Mock).mockResolvedValue(null);

    (workPerformanceModule.savePerformanceRecord as jest.Mock).mockResolvedValue({
      performanceRecordId: 'record-001',
    });
  });

  it('should throw InvalidWorkTypeError when specified workTypeId does not exist', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'invalid-type-id',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '12:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: 'テスト作業',
      remarks: 'なし',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: expect.stringMatching(/InvalidWorkTypeError|Error/),
        message: expect.stringContaining(
          '指定された作業タイプは見つかりません。または無効です。'
        ),
      })
    );

    expect(workPerformanceModule.savePerformanceRecord as jest.Mock).not.toHaveBeenCalled();
  });
});