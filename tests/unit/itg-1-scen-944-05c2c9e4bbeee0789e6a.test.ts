import { saveProductivityData, SaveProductivityDataInput, SaveProductivityDataOutput } from '../../src/logic/data-persistence';

describe('SCEN-944: saveProductivityData - データベース接続エラー時のエラーハンドリング', () => {
  const input: SaveProductivityDataInput = {
    productivityDataId: null,
    workResultId: 'WR001',
    workerId: 'W001',
    facilityId: 'F001',
    teamId: 'T001',
    workDate: '2024-01-15',
    plannedWorkTime: 480,
    actualWorkTime: 450,
    completedItemCount: 100,
    productivityRate: 0.9375,
    qualityScore: 0.95,
    errorCount: 2,
    proficiencyLevel: '中級',
    remarks: null,
    createdBy: 'admin001',
    updatedBy: null,
  };

  it('データベースへの保存操作が接続エラーで失敗する場合、PersistenceFailure エラーが発生する', async () => {
    let caughtError: any = undefined;
    let result: SaveProductivityDataOutput | undefined = undefined;

    try {
      result = await saveProductivityData(input);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('生産性データの保存に失敗しました。システム管理者に連絡してください。');
    expect(caughtError).toHaveProperty('code', 'PersistenceFailure');
    expect(caughtError).toHaveProperty('condition', 'データベースへの保存操作がタイムアウト、接続エラー、制約違反により失敗した。');
    expect(result).toBeUndefined();
  });
});