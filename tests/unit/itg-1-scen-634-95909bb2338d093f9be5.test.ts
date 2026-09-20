import { saveProficiency } from '../../src/logic/data-persistence';

describe('SCEN-634: 作業者習熟度データ入力形式エラー検証', () => {
  it('必須フィールド（workerId）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: null,
      jobType: 'assembly',
      proficiencyLevel: 'intermediate',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('必須フィールド');
      expect(error.message).toContain('workerId');
    }
  });

  it('必須フィールド（jobType）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: null,
      proficiencyLevel: 'intermediate',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('jobType');
    }
  });

  it('必須フィールド（proficiencyLevel）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: 'assembly',
      proficiencyLevel: null,
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('proficiencyLevel');
    }
  });

  it('必須フィールド（evaluationDate）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: 'assembly',
      proficiencyLevel: 'intermediate',
      evaluationDate: null,
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('evaluationDate');
    }
  });

  it('必須フィールド（evaluatedBy）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: 'assembly',
      proficiencyLevel: 'intermediate',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: null,
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('evaluatedBy');
    }
  });

  it('必須フィールド（createdBy）がnullの場合、InvalidProficiencyInputエラーが発生する', async () => {
    const invalidInput = {
      proficiencyId: null,
      workerId: 'worker-001',
      jobType: 'assembly',
      proficiencyLevel: 'intermediate',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: 'evaluator-001',
      remarks: 'Test remark',
      createdBy: null,
      updatedBy: undefined,
    };

    try {
      await saveProficiency(invalidInput);
      fail('InvalidProficiencyInputエラーが発生すると予想されていますが、発生しませんでした');
    } catch (error: any) {
      expect(error.name).toBe('InvalidProficiencyInputError');
      expect(error.message).toContain('習熟度データの入力形式が不正です');
      expect(error.message).toContain('createdBy');
    }
  });
});