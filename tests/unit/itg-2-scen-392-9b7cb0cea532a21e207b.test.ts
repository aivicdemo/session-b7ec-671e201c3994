import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';
import * as workPerformanceModule from '../../src/logic/work-performance-data-input';

describe('SCEN-392: オプション項目の作業内容説明が空文字列のとき、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully save performance record when workDescription is empty string', async () => {
    // スタブ設定: authenticateUserは成功を返す
    jest.spyOn(workPerformanceModule, 'authenticateUser' as any).mockResolvedValue({ userId: 'user001', valid: true });

    // スタブ設定: authorizeUserActionは成功を返す
    jest.spyOn(workPerformanceModule, 'authorizeUserAction' as any).mockResolvedValue({ authorized: true });

    // スタブ設定: validateInputDataは成功を返す
    jest.spyOn(workPerformanceModule, 'validateInputData' as any).mockResolvedValue({ valid: true, errors: [] });

    // スタブ設定: findWorkerByIdは有効な作業者データを返す
    jest.spyOn(workPerformanceModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker001',
      name: 'Test Worker',
      departmentId: 'dept001',
      status: '稼働中',
    });

    // スタブ設定: findDepartmentByIdは有効な部門データを返す
    jest.spyOn(workPerformanceModule, 'findDepartmentById' as any).mockResolvedValue({
      departmentId: 'dept001',
      name: 'Test Department',
      status: 'active',
    });

    // スタブ設定: findWorkTypeByIdは有効な作業タイプデータを返す
    jest.spyOn(workPerformanceModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'type001',
      name: 'Test Work Type',
      standardProductivity: 100,
    });

    // スタブ設定: findPlacementPlanByWorkerAndDateは配置計画データを返す
    jest.spyOn(workPerformanceModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId: 'plan001',
      workerId: 'worker001',
      workDate: '2024-01-15',
    });

    // スタブ設定: savePerformanceRecordは成功し、一意のperformanceRecordIdを返す
    jest.spyOn(workPerformanceModule, 'savePerformanceRecord' as any).mockResolvedValue({
      success: true,
      performanceRecordId: 'perf-rec-001',
      productivityDataId: 'prod-data-001',
      calculatedProductivityRate: 0.85,
    });

    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '定期業務',
    };

    const result = await submitWorkPerformanceData(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBeDefined();
    expect(typeof result.performanceRecordId).toBe('string');
    expect(result.performanceRecordId.length).toBeGreaterThan(0);
    expect(result.workerId).toBe('worker001');
    expect(result.workDate).toBe('2024-01-15');
    expect(result.calculatedProductivityRate).toBeGreaterThanOrEqual(0.0);
    expect(result.calculatedProductivityRate).toBeLessThanOrEqual(1.0);
    expect(result.savedTimestamp).toBeDefined();
    expect(typeof result.savedTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedTimestamp)).toBe(true);
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should persist empty workDescription to database', async () => {
    // スタブ設定: authenticateUserは成功を返す
    jest.spyOn(workPerformanceModule, 'authenticateUser' as any).mockResolvedValue({ userId: 'user001', valid: true });

    // スタブ設定: authorizeUserActionは成功を返す
    jest.spyOn(workPerformanceModule, 'authorizeUserAction' as any).mockResolvedValue({ authorized: true });

    // スタブ設定: validateInputDataは成功を返す
    jest.spyOn(workPerformanceModule, 'validateInputData' as any).mockResolvedValue({ valid: true, errors: [] });

    // スタブ設定: findWorkerByIdは有効な作業者データを返す
    jest.spyOn(workPerformanceModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker001',
      name: 'Test Worker',
      departmentId: 'dept001',
      status: '稼働中',
    });

    // スタブ設定: findDepartmentByIdは有効な部門データを返す
    jest.spyOn(workPerformanceModule, 'findDepartmentById' as any).mockResolvedValue({
      departmentId: 'dept001',
      name: 'Test Department',
      status: 'active',
    });

    // スタブ設定: findWorkTypeByIdは有効な作業タイプデータを返す
    jest.spyOn(workPerformanceModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'type001',
      name: 'Test Work Type',
      standardProductivity: 100,
    });

    // スタブ設定: findPlacementPlanByWorkerAndDateは配置計画データを返す
    jest.spyOn(workPerformanceModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId: 'plan001',
      workerId: 'worker001',
      workDate: '2024-01-15',
    });

    // スタブ設定: savePerformanceRecordは成功し、一意のperformanceRecordIdを返す
    jest.spyOn(workPerformanceModule, 'savePerformanceRecord' as any).mockResolvedValue({
      success: true,
      performanceRecordId: 'perf-rec-002',
      productivityDataId: 'prod-data-002',
      calculatedProductivityRate: 0.85,
    });

    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '定期業務',
    };

    const result = await submitWorkPerformanceData(input);

    expect(result.success).toBe(true);
    expect(result.performanceRecordId).toBeDefined();
  });

  it('should include all required output fields with valid values', async () => {
    // スタブ設定: authenticateUserは成功を返す
    jest.spyOn(workPerformanceModule, 'authenticateUser' as any).mockResolvedValue({ userId: 'user001', valid: true });

    // スタブ設定: authorizeUserActionは成功を返す
    jest.spyOn(workPerformanceModule, 'authorizeUserAction' as any).mockResolvedValue({ authorized: true });

    // スタブ設定: validateInputDataは成功を返す
    jest.spyOn(workPerformanceModule, 'validateInputData' as any).mockResolvedValue({ valid: true, errors: [] });

    // スタブ設定: findWorkerByIdは有効な作業者データを返す
    jest.spyOn(workPerformanceModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker001',
      name: 'Test Worker',
      departmentId: 'dept001',
      status: '稼働中',
    });

    // スタブ設定: findDepartmentByIdは有効な部門データを返す
    jest.spyOn(workPerformanceModule, 'findDepartmentById' as any).mockResolvedValue({
      departmentId: 'dept001',
      name: 'Test Department',
      status: 'active',
    });

    // スタブ設定: findWorkTypeByIdは有効な作業タイプデータを返す
    jest.spyOn(workPerformanceModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'type001',
      name: 'Test Work Type',
      standardProductivity: 100,
    });

    // スタブ設定: findPlacementPlanByWorkerAndDateは配置計画データを返す
    jest.spyOn(workPerformanceModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId: 'plan001',
      workerId: 'worker001',
      workDate: '2024-01-15',
    });

    // スタブ設定: savePerformanceRecordは成功し、一意のperformanceRecordIdを返す
    jest.spyOn(workPerformanceModule, 'savePerformanceRecord' as any).mockResolvedValue({
      success: true,
      performanceRecordId: 'perf-rec-003',
      productivityDataId: 'prod-data-003',
      calculatedProductivityRate: 0.85,
    });

    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '定期業務',
    };

    const result = await submitWorkPerformanceData(input);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('performanceRecordId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('workDate');
    expect(result).toHaveProperty('calculatedProductivityRate');
    expect(result).toHaveProperty('savedTimestamp');
    expect(result).toHaveProperty('message');
  });
});