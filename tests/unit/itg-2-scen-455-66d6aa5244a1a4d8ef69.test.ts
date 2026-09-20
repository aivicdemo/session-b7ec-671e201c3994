import { saveProductivityData } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-455: 生産性データの更新保存', () => {
  it('更新時に有効な入力データで既存の生産性データが正常に更新され、成功フラグと既存IDが返される', async () => {
    jest.spyOn(persistenceLayer, 'authorizeUserAction' as any).mockReturnValue(true);
    jest.spyOn(persistenceLayer, 'validateInputData' as any).mockReturnValue({ valid: true, errors: [] });
    jest.spyOn(persistenceLayer, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'worker-123',
      workerName: 'テスト作業者',
      siteId: 'site-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      found: true,
    });

    const input = {
      productivityDataId: 'prod-data-999',
      performanceRecordId: 'perf-rec-555',
      workerId: 'worker-123',
      siteId: 'site-001',
      teamId: 'team-001',
      workDate: new Date('2024-01-15'),
      plannedWorkHours: 480,
      actualWorkHours: 540,
      completionCount: 120,
      productivityRate: 90.0,
      qualityScore: 95.0,
      errorCount: 6,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: '品質向上傾向',
      createdBy: 'user-002',
      updatedBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'update' as const,
    };

    const result = await saveProductivityData(input);

    expect(result.success).toBe(true);
    expect(result.productivityDataId).toBe('prod-data-999');
    expect(result.operation).toBe('update');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.message === undefined || typeof result.message === 'string').toBe(true);
  });
});