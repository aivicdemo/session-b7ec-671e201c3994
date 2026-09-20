import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import * as workPerformanceModule from '../../src/logic/work-performance-data-input';

describe('SCEN-380: 作業実績データ入力 - 正常入力で実績データが正常に保存され、成功応答が返る', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常な入力値で submitWorkPerformanceData を実行すると、実績データが保存され成功応答が返る', async () => {
    const input = {
      userId: 'USER001',
      workerId: 'WORKER001',
      departmentId: 'DEPT001',
      workTypeId: 'WTYPE001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: '商品仕分け作業',
      remarks: '特に問題なし',
    };

    // Mock internal dependencies by spying on the module
    const authenticateUserMock = jest.fn().mockResolvedValue(true);
    const authorizeUserActionMock = jest.fn().mockResolvedValue(true);
    const validateInputDataMock = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });
    const findWorkerByIdMock = jest.fn().mockResolvedValue({
      workerId: 'WORKER001',
      workerName: 'Worker Name',
      稼働状況: '稼働中',
    });
    const findDepartmentByIdMock = jest.fn().mockResolvedValue({
      departmentId: 'DEPT001',
      departmentName: 'Department Name',
      ステータス: 'active',
    });
    const findWorkTypeByIdMock = jest.fn().mockResolvedValue({
      workTypeId: 'WTYPE001',
      workTypeName: 'Work Type Name',
      有効フラグ: true,
    });
    const savePerformanceRecordMock = jest.fn().mockResolvedValue({
      performanceRecordId: 'PERF20240115001',
      savedTimestamp: '2024-01-15T10:45:30.000Z',
      calculatedProductivityRate: 0.85,
    });
    const findPlacementPlanByWorkerAndDateMock = jest.fn().mockResolvedValue({
      placementPlanId: 'PLAN001',
      completedQuantity: 58,
      requiredTimeMinutes: 90,
    });

    // Mock the internal helper functions within the module
    jest.spyOn(workPerformanceModule as any, 'authenticateUser').mockImplementation(authenticateUserMock);
    jest.spyOn(workPerformanceModule as any, 'authorizeUserAction').mockImplementation(authorizeUserActionMock);
    jest.spyOn(workPerformanceModule as any, 'validateInputData').mockImplementation(validateInputDataMock);
    jest.spyOn(workPerformanceModule as any, 'findWorkerById').mockImplementation(findWorkerByIdMock);
    jest.spyOn(workPerformanceModule as any, 'findDepartmentById').mockImplementation(findDepartmentByIdMock);
    jest.spyOn(workPerformanceModule as any, 'findWorkTypeById').mockImplementation(findWorkTypeByIdMock);
    jest.spyOn(workPerformanceModule as any, 'savePerformanceRecord').mockImplementation(savePerformanceRecordMock);
    jest.spyOn(workPerformanceModule as any, 'findPlacementPlanByWorkerAndDate').mockImplementation(findPlacementPlanByWorkerAndDateMock);

    // Call the actual implementation
    const result = await submitWorkPerformanceData(input);

    // Verify the result matches the expected output
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('PERF20240115001');
    expect(result.workerId).toBe('WORKER001');
    expect(result.workDate).toBe('2024-01-15');
    expect(result.calculatedProductivityRate).toBeCloseTo(0.85, 1);
    expect(result.savedTimestamp).toBe('2024-01-15T10:45:30.000Z');
    expect(result.message).toBe('実績データが正常に保存されました。');

    // Verify that the internal dependencies were called with correct parameters
    expect(authenticateUserMock).toHaveBeenCalledWith('USER001');
    expect(authorizeUserActionMock).toHaveBeenCalledWith('USER001', expect.any(String));
    expect(validateInputDataMock).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'USER001',
      workerId: 'WORKER001',
      departmentId: 'DEPT001',
      workTypeId: 'WTYPE001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
    }));
    expect(findWorkerByIdMock).toHaveBeenCalledWith('WORKER001');
    expect(findDepartmentByIdMock).toHaveBeenCalledWith('DEPT001');
    expect(findWorkTypeByIdMock).toHaveBeenCalledWith('WTYPE001');
    expect(findPlacementPlanByWorkerAndDateMock).toHaveBeenCalledWith('WORKER001', '2024-01-15');
    expect(savePerformanceRecordMock).toHaveBeenCalled();
  });
});