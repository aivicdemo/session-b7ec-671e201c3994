import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';
import * as dataPeristence from '../../src/logic/data-persistence';

describe('SCEN-336: 作業指示IDがテーブルに存在しない場合、作業指示未検出エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw WorkInstructionNotFoundError when workInstructionId does not exist in database', async () => {
    // スタブ設定: getWorkInstructionById('WI-99999')がnullを返す
    jest.spyOn(dataPeristence, 'getWorkInstructionById').mockResolvedValue(null);

    // スタブ設定: getWorkerById('worker-001')が有効な作業者オブジェクトを返す
    jest.spyOn(dataPeristence, 'getWorkerById').mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      facilityId: 'facility-001',
      teamId: 'team-001',
      occupation: 'assembly',
      operationalStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'admin',
    });

    // スタブ設定: getProficiencyById('worker-001')が習熟度データを返す
    jest.spyOn(dataPeristence, 'getProficiencyById').mockResolvedValue({
      proficiencyId: 'prof-001',
      workerId: 'worker-001',
      jobCategory: 'assembly',
      proficiencyLevel: 3,
      evaluatedDate: new Date('2024-01-01'),
      evaluatorId: 'evaluator-001',
      remarks: 'Intermediate level',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    // テスト準備: 入力データを構成
    // handyTerminalWorkResults配列に、workInstructionId='WI-99999'（データベースに存在しないID）、workerId='worker-001'を含むレコード1件を追加する
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'WI-99999',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T09:00:00Z',
        completedQuantity: 50,
        defectQuantity: 2,
        errorCount: 1,
      },
    ];

    // wmsWorkResults配列は空とする
    const wmsWorkResults: Array<{
      workInstructionId: string;
      workerId: string;
      facilityId: string;
      teamId: string;
      workStartDateTime: string;
      workEndDateTime: string;
      completedQuantity: number;
      defectQuantity: number;
      remarks?: string;
    }> = [];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'user-001';

    // 対象処理を実行し、例外が発生することを検証
    let exceptionThrown = false;
    let thrownError: Error | null = null;

    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId,
      });
    } catch (error: unknown) {
      exceptionThrown = true;
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // 例外が発生したことを検証
    expect(exceptionThrown).toBe(true);

    // 例外の型と文言を検証
    expect(thrownError?.name).toBe('WorkInstructionNotFoundError');
    expect(thrownError?.message).toBe('作業指示ID WI-99999 が見つかりません。');
  });
});