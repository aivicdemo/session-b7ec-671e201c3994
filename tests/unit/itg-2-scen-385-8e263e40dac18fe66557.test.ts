import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import * as workPerformanceModule from '../../src/logic/work-performance-data-input';

jest.mock('../../src/logic/work-performance-data-input', () => {
  const actual = jest.requireActual('../../src/logic/work-performance-data-input');
  return {
    ...actual,
    authenticateUser: jest.fn(),
    authorizeUserAction: jest.fn(),
    validateInputData: jest.fn(),
    findWorkerById: jest.fn(),
    findDepartmentById: jest.fn(),
    findWorkTypeById: jest.fn(),
    savePerformanceRecord: jest.fn(),
  };
});

describe('SCEN-385: 実績数量が負数またはゼロのとき、InvalidQuantityErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (workPerformanceModule.authenticateUser as jest.Mock).mockResolvedValue({
      userId: 'user001',
      isValid: true,
    });

    (workPerformanceModule.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    (workPerformanceModule.validateInputData as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    (workPerformanceModule.findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker001',
      稼働状況: '稼働中',
    });

    (workPerformanceModule.findDepartmentById as jest.Mock).mockResolvedValue({
      departmentId: 'dept001',
      ステータス: '有効',
    });

    (workPerformanceModule.findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'worktype001',
      有効フラグ: true,
    });

    (workPerformanceModule.savePerformanceRecord as jest.Mock).mockResolvedValue({
      performanceRecordId: 'perf001',
    });
  });

  it('should throw InvalidQuantityError when completedQuantity is 0', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: 0,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidQuantityError',
        message: '実績数量は正の数値である必要があります。',
      })
    );

    expect(workPerformanceModule.savePerformanceRecord as jest.Mock).not.toHaveBeenCalled();
  });

  it('should throw InvalidQuantityError when completedQuantity is negative', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: -5,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidQuantityError',
        message: '実績数量は正の数値である必要があります。',
      })
    );

    expect(workPerformanceModule.savePerformanceRecord as jest.Mock).not.toHaveBeenCalled();
  });
});