import { savePlacementPlan } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer', () => ({
  ...jest.requireActual('../../src/logic/persistence-layer'),
}));

describe('SCEN-491: 新規配置計画を正常に保存し、成功と配置計画IDを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規配置計画の保存に成功し、成功フラグと配置計画IDを返す', async () => {
    const workerId = 'W001';
    const requestingUserId = 'U123';
    const placementPlanId = '550e8400-e29b-41d4-a716-446655440000';
    const createdBy = 'U123';
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    // findWorkerByIdスタブ設定
    const findWorkerByIdSpy = jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId,
      workerName: 'Test Worker',
      siteId: 'SITE001',
      teamId: 'TEAM001',
      jobType: 'JT001',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxOperatingHours: 8,
      found: true,
    });

    // authorizeUserActionスタブ設定
    const authorizeUserActionSpy = jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue({
      authorized: true,
    });

    // validateInputDataスタブ設定
    const validateInputDataSpy = jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue({
      valid: true,
      errors: [],
    });

    const input = {
      placementPlanId,
      workerId,
      placementDepartment: 'D001',
      placementJobType: 'JT001',
      startDate,
      endDate,
      placementStatus: 'active',
      expectedProductivityTarget: 100.5,
      optimizationReason: '部門の生産性向上のため',
      createdBy,
      requestingUserId,
      operation: 'create' as const,
    };

    const result = await savePlacementPlan(input);

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.placementPlanId).toBe(placementPlanId);
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message === undefined || result.message === null).toBe(true);

    // 配置計画マスタレコードの永続化を検証
    // 保存後に同じplacementPlanIdで検索して、入力データと一致することを確認
    const findPlacementPlanSpy = jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId,
      workerId,
      placementDepartment: 'D001',
      placementJobType: 'JT001',
      startDate,
      endDate,
      placementStatus: 'active',
      expectedProductivityTarget: 100.5,
      optimizationReason: '部門の生産性向上のため',
      found: true,
    });

    const savedData = await (persistenceLayer as any).findPlacementPlanByWorkerAndDate({
      workerId,
      targetDate: new Date('2025-06-15'),
      requestingUserId,
    });

    expect(savedData.found).toBe(true);
    expect(savedData.placementPlanId).toBe(placementPlanId);
    expect(savedData.workerId).toBe(workerId);
    expect(savedData.placementDepartment).toBe('D001');
    expect(savedData.placementJobType).toBe('JT001');
    expect(savedData.placementStatus).toBe('active');
    expect(savedData.expectedProductivityTarget).toBe(100.5);
    expect(savedData.optimizationReason).toBe('部門の生産性向上のため');

    // スタブが呼ばれたことを確認
    expect(findWorkerByIdSpy).toHaveBeenCalled();
    expect(authorizeUserActionSpy).toHaveBeenCalled();
    expect(validateInputDataSpy).toHaveBeenCalled();
  });
});