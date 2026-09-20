import { saveProficiency } from '../../src/logic/data-persistence';

describe('SCEN-635: 更新時にproficiencyIdが指定されないと入力形式エラーが発生する', () => {
  it('should throw InvalidProficiencyInput when proficiencyId is undefined during update', async () => {
    const input = {
      proficiencyId: undefined,
      workerId: 'W001',
      jobType: '仕分け',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'E001',
      remarks: null,
      createdBy: 'C001',
      updatedBy: undefined,
    };

    await expect(saveProficiency(input)).rejects.toMatchObject({
      name: 'InvalidProficiencyInput',
      message: '習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。',
    });
  });
});