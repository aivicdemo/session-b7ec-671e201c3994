import { saveProficiency } from '../../src/logic/data-persistence';

describe('SCEN-640: evaluationDateが未来日だと評価日無効エラーが発生する', () => {
  it('should throw EvaluationDateInvalid error when evaluationDate is in the future', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDateString = tomorrow.toISOString().split('T')[0];

    const input = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: 'assembly',
      proficiencyLevel: '上級',
      evaluationDate: futureDateString,
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    await expect(saveProficiency(input)).rejects.toMatchObject({
      code: 'EvaluationDateInvalid',
      message: expect.stringContaining('評価日は本日以前の日付である必要があります'),
    });
  });
});