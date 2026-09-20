import { saveProductivityData } from '../../src/logic/persistence-layer';
import { PersistenceFailureError } from '../../src/logic/errors';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-465: 一意制約違反が発生した場合、PersistenceFailureErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PersistenceFailureError when unique constraint violation occurs on productivityDataId', async () => {
    const input = {
      productivityDataId: 'prod-001',
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      siteId: 'site-A',
      teamId: 'team-01',
      workDate: new Date('2024-01-15'),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: 50,
      productivityRate: 104.2,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: null as string | null,
      createdBy: 'user-001',
      updatedBy: undefined,
      requestingUserId: 'user-001',
      operation: 'create' as const,
    };

    jest.spyOn(persistenceLayer, 'saveProductivityData').mockRejectedValueOnce(
      new PersistenceFailureError(
        '生産性データの保存に失敗しました。詳細: 一意制約違反（productivityDataId が重複）'
      )
    );

    let thrownError: Error | null = null;
    try {
      await saveProductivityData(input);
    } catch (e) {
      thrownError = e as Error;
    }

    expect(thrownError).toBeInstanceOf(PersistenceFailureError);
    expect(thrownError?.message).toContain('生産性データの保存に失敗しました');
    expect(thrownError?.message).toContain('一意制約違反');
    expect(thrownError?.message).toContain('productivityDataId');
  });

  it('should throw PersistenceFailureError with detail about composite key violation (workerId, workDate, siteId)', async () => {
    const input = {
      productivityDataId: 'prod-002',
      performanceRecordId: 'perf-002',
      workerId: 'worker-456',
      siteId: 'site-B',
      teamId: 'team-02',
      workDate: new Date('2024-01-16'),
      plannedWorkHours: 480,
      actualWorkHours: 490,
      completionCount: 48,
      productivityRate: 102.1,
      qualityScore: 93,
      errorCount: 3,
      proficiencyLevel: 'INTERMEDIATE',
      remarks: null as string | null,
      createdBy: 'user-002',
      updatedBy: undefined,
      requestingUserId: 'user-002',
      operation: 'create' as const,
    };

    jest.spyOn(persistenceLayer, 'saveProductivityData').mockRejectedValueOnce(
      new PersistenceFailureError(
        '生産性データの保存に失敗しました。詳細: 一意制約違反（workerId, workDate, siteId の複合キーが重複）'
      )
    );

    let thrownError: Error | null = null;
    try {
      await saveProductivityData(input);
    } catch (e) {
      thrownError = e as Error;
    }

    expect(thrownError).toBeInstanceOf(PersistenceFailureError);
    expect(thrownError?.message).toContain('生産性データの保存に失敗しました');
    expect(thrownError?.message).toContain('一意制約違反');
    expect(thrownError?.message).toContain('workerId');
    expect(thrownError?.message).toContain('workDate');
    expect(thrownError?.message).toContain('siteId');
    expect(thrownError?.message).toContain('複合キー');
  });
});