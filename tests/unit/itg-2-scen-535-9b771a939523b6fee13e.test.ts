import { savePerformanceRecord } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-535: 作業日が未来日のときInvalidWorkDateErrorが発生する', () => {
  it('should throw InvalidWorkDateError when workDate is in the future', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const input = {
      performanceRecordId: 'uuid-123',
      workerId: 'worker-001',
      placementPlanId: 'plan-001',
      workDate: tomorrow,
      workContent: 'ピッキング作業',
      completionCount: 50,
      requiredTimeMinutes: 480,
      qualityScore: 85,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const date = String(tomorrow.getDate()).padStart(2, '0');
    const expectedDateFormat = `${year}年${month}月${date}日`;

    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockReturnValue(true);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockReturnValue(undefined);
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'picking',
      operatingStatus: 'active',
      found: true,
    });
    jest.spyOn(persistenceLayer, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue({
      placementPlanId: 'plan-001',
      workerId: 'worker-001',
      placementDepartment: 'department-001',
      placementJobType: 'picking',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      placementStatus: 'active',
      expectedProductivityTarget: 100,
      found: true,
    });

    await expect(savePerformanceRecord(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidWorkDateError',
        message: expect.stringContaining(`作業日 ${expectedDateFormat} は有効な範囲外です。`),
      })
    );
  });
});