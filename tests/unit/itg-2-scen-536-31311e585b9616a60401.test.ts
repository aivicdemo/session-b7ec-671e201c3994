import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-536: 作業日が過去90日を超えるときInvalidWorkDateErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidWorkDateError when workDate exceeds 90 days in the past', async () => {
    // 現在から91日前の日付を計算
    const now = new Date();
    const ninetyOneDaysAgo = new Date(now);
    ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

    // authorizeUserActionのスタブを設定
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockResolvedValue(true);

    // validateInputDataのスタブを設定
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockResolvedValue(true);

    // findWorkerByIdのスタブを設定
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'PICKING',
      operatingStatus: 'active',
      hourlyRate: 1000,
      maxOperatingHours: 8,
      found: true,
    });

    // findPlacementPlanByWorkerAndDateのスタブを設定
    jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId: 'plan-456',
      workerId: 'worker-123',
      placementDepartment: 'dept-001',
      placementJobType: 'PICKING',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      placementStatus: 'active',
      expectedProductivityTarget: 85,
      optimizationReason: null,
      found: true,
    });

    const input = {
      performanceRecordId: 'uuid-001',
      workerId: 'worker-123',
      placementPlanId: 'plan-456',
      workDate: ninetyOneDaysAgo,
      workContent: 'ピッキング作業',
      completionCount: 100,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    await expect(savePerformanceRecord(input)).rejects.toThrow();
    await expect(savePerformanceRecord(input)).rejects.toMatchObject({
      message: expect.stringMatching(/^作業日 .* は有効な範囲外です。$/),
    });
  });
});