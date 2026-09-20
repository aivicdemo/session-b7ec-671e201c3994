import { recordWorkExecutionStart } from '../../src/logic/work-execution-tracking';
import * as workExecutionTrackingModule from '../../src/logic/work-execution-tracking';

describe('SCEN-298: 予定完了時刻が現在時刻より前の場合の警告', () => {
  let findWorkerByIdSpy: jest.SpyInstance;
  let findWorkTypeByIdSpy: jest.SpyInstance;
  let saveProductivityDataSpy: jest.SpyInstance;
  let synchronizeDataWithWESAndWMSSpy: jest.SpyInstance;

  beforeEach(() => {
    findWorkerByIdSpy = jest.spyOn(workExecutionTrackingModule, 'findWorkerById' as any).mockResolvedValue({
      workerId: 'valid-worker-id-001',
      workerName: 'テスト作業者',
      siteId: 'valid-site-id-001',
      teamId: 'valid-team-id-001',
      jobType: 'standard',
      status: 'active',
    });

    findWorkTypeByIdSpy = jest.spyOn(workExecutionTrackingModule, 'findWorkTypeById' as any).mockResolvedValue({
      workTypeId: 'valid-work-type-id-001',
      workTypeName: 'テスト作業',
      description: 'テスト用作業種別',
      standardProductivity: 100,
      difficultyLevel: 3,
      isActive: true,
    });

    saveProductivityDataSpy = jest.spyOn(workExecutionTrackingModule, 'saveProductivityData' as any).mockResolvedValue(undefined);
    synchronizeDataWithWESAndWMSSpy = jest.spyOn(workExecutionTrackingModule, 'synchronizeDataWithWESAndWMS' as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('予定完了時刻が現在時刻より前の場合、InvalidScheduledCompletionTimeErrorが発生する', async () => {
    // 現在時刻を基準に設定
    const now = new Date('2024-01-15T10:00:00Z');
    const executionStartDateTime = now;
    // 予定完了時刻を現在時刻より前に設定（仕様条件に合わせる）
    const scheduledCompletionDateTime = new Date(now.getTime() - 30 * 60 * 1000); // 30分前

    const workerId = 'valid-worker-id-001';
    const workTypeId = 'valid-work-type-id-001';
    const targetProductId = 'valid-product-id-001';

    const input = {
      workerId,
      workTypeId,
      targetProductId,
      executionStartDateTime,
      scheduledCompletionDateTime,
    };

    await expect(recordWorkExecutionStart(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidScheduledCompletionTimeError',
        message: '予定完了時刻は作業開始時刻より後である必要があります。',
      })
    );

    // saveProductivityData と synchronizeDataWithWESAndWMS が呼び出されていないことを確認
    expect(saveProductivityDataSpy).not.toHaveBeenCalled();
    expect(synchronizeDataWithWESAndWMSSpy).not.toHaveBeenCalled();
  });
});