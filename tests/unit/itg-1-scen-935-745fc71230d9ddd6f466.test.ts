import { saveProductivityData } from '../../src/logic/data-persistence';

describe('SCEN-935: 生産性データ保存時の入力値検証', () => {
  it('workDate フィールドが ISO 8601形式でない場合、InvalidProductivityDataInput エラーが発生する', async () => {
    const invalidInput = {
      productivityDataId: null,
      workResultId: 'result-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '20240115', // ISO 8601形式ではない
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 50,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: '初級',
      createdBy: 'user-001',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toMatchObject({
      name: 'InvalidProductivityDataInput',
      message: '生産性データの入力値が不正です。必須フィールドを確認してください。',
    });
  });

  it('他の必須フィールドが有効でも workDate が不正形式なら保存されない', async () => {
    const invalidInput = {
      productivityDataId: undefined,
      workResultId: 'valid-result-id',
      workerId: 'valid-worker-id',
      facilityId: 'valid-facility-id',
      teamId: 'valid-team-id',
      workDate: '2024/01/15', // スラッシュ区切りは ISO 8601形式ではない
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 50,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: '中級',
      createdBy: 'valid-user-id',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toMatchObject({
      name: 'InvalidProductivityDataInput',
      message: '生産性データの入力値が不正です。必須フィールドを確認してください。',
    });
  });

  it('workDate が ISO 8601標準形式でない場合（YYYYMMDD形式）、InvalidProductivityDataInput エラーが発生する', async () => {
    const invalidInput = {
      productivityDataId: null,
      workResultId: 'result-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15 10:30:00', // スペース区切りは ISO 8601形式ではない
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 50,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 1,
      proficiencyLevel: '初級',
      createdBy: 'user-001',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toMatchObject({
      name: 'InvalidProductivityDataInput',
      message: '生産性データの入力値が不正です。必須フィールドを確認してください。',
    });
  });
});