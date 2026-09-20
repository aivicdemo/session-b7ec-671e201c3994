import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import * as workPerformanceModule from '../../src/logic/work-performance-data-input';

describe('SCEN-393: submitWorkPerformanceData - オプション項目の備考が空文字列のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully save performance record with empty remarks field', async () => {
    const mockAuthenticateUser = jest.fn().mockResolvedValue({
      userId: 'U001',
      isAuthenticated: true,
    });

    const mockAuthorizeUserAction = jest.fn().mockResolvedValue({
      isAuthorized: true,
    });

    const mockValidateInputData = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
    });

    const mockFindWorkerById = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'テスト作業者',
      departmentId: 'D001',
      status: '稼働中',
    });

    const mockFindDepartmentById = jest.fn().mockResolvedValue({
      departmentId: 'D001',
      departmentName: 'テスト部門',
      status: 'active',
    });

    const mockFindWorkTypeById = jest.fn().mockResolvedValue({
      workTypeId: 'WT001',
      workTypeName: 'テスト作業タイプ',
      standardProductivity: 100,
    });

    const mockSavePerformanceRecord = jest.fn().mockResolvedValue({
      success: true,
      performanceRecordId: 'REC20250115001',
      workerId: 'W001',
      workDate: '2025-01-15',
      calculatedProductivityRate: 0.85,
      savedTimestamp: '2025-01-15T10:30:45Z',
      message: '作業実績データを正常に保存しました。',
    });

    jest.spyOn(workPerformanceModule, 'authenticateUser' as any).mockImplementation(mockAuthenticateUser);
    jest.spyOn(workPerformanceModule, 'authorizeUserAction' as any).mockImplementation(mockAuthorizeUserAction);
    jest.spyOn(workPerformanceModule, 'validateInputData' as any).mockImplementation(mockValidateInputData);
    jest.spyOn(workPerformanceModule, 'findWorkerById' as any).mockImplementation(mockFindWorkerById);
    jest.spyOn(workPerformanceModule, 'findDepartmentById' as any).mockImplementation(mockFindDepartmentById);
    jest.spyOn(workPerformanceModule, 'findWorkTypeById' as any).mockImplementation(mockFindWorkTypeById);
    jest.spyOn(workPerformanceModule, 'savePerformanceRecord' as any).mockImplementation(mockSavePerformanceRecord);

    const input = {
      userId: 'U001',
      workerId: 'W001',
      departmentId: 'D001',
      workTypeId: 'WT001',
      workDate: '2025-01-15',
      startTime: '09:00',
      endTime: '11:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: '通常の棚卸し作業',
      remarks: '',
    };

    const result = await submitWorkPerformanceData(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBe('REC20250115001');
    expect(result.workerId).toBe('W001');
    expect(result.workDate).toBe('2025-01-15');
    expect(result.calculatedProductivityRate).toBe(0.85);
    expect(result.savedTimestamp).toBe('2025-01-15T10:30:45Z');
    expect(result.message).toBe('作業実績データを正常に保存しました。');

    expect(mockAuthenticateUser).toHaveBeenCalled();
    expect(mockAuthorizeUserAction).toHaveBeenCalled();
    expect(mockValidateInputData).toHaveBeenCalled();
    expect(mockFindWorkerById).toHaveBeenCalledWith('W001');
    expect(mockFindDepartmentById).toHaveBeenCalledWith('D001');
    expect(mockFindWorkTypeById).toHaveBeenCalledWith('WT001');
    expect(mockSavePerformanceRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'W001',
        workDate: '2025-01-15',
        workDescription: '通常の棚卸し作業',
        remarks: '',
      })
    );
  });
});