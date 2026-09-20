import { saveProductivityData } from '../../src/logic/persistence-layer';
import { SaveProductivityDataInput } from '../../src/logic/persistence-layer';

describe('SCEN-461: saveProductivityData - 作業日が未来日の場合、InvalidDateRangeErrorが発生する', () => {
  it('should throw InvalidDateRangeError when workDate is in the future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const input: SaveProductivityDataInput = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-001',
      siteId: 'site-001',
      teamId: 'team-001',
      workDate: futureDate,
      plannedWorkHours: 480,
      actualWorkHours: 480,
      completionCount: 10,
      productivityRate: 100,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: 'INTERMEDIATE',
      createdBy: 'user-001',
      requestingUserId: 'user-001',
      operation: 'create',
    };

    await expect(saveProductivityData(input)).rejects.toThrow(Error);
    
    try {
      await saveProductivityData(input);
      fail('Expected InvalidDateRangeError to be thrown');
    } catch (error: any) {
      expect(error.message).toContain('作業日または作業時間の範囲が無効です');
      expect(error.message).toContain('480');
    }
  });
});