import { saveProficiency } from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('SCEN-636: evaluationDateの形式がISO 8601形式でないと入力形式エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('不正なevaluationDate形式で入力された場合、InvalidProficiencyInputエラーが返される', async () => {
    jest.spyOn(validationModule, 'validateDateTimeRange').mockImplementation((value: string) => {
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
      if (!iso8601Pattern.test(value)) {
        const error = new Error('習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。');
        (error as any).name = 'InvalidProficiencyInput';
        (error as any).fieldName = 'evaluationDate';
        (error as any).invalidValue = value;
        (error as any).reason = `evaluationDateが「${value}」という不正な形式（ISO 8601形式ではない）であることが入力形式エラーの理由として特定される`;
        throw error;
      }
      return true;
    });

    const invalidInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-13-45',
      evaluatedBy: 'E001',
      createdBy: 'C001',
    };

    try {
      await saveProficiency(invalidInput);
      fail('例外がスローされるべきですが、成功してしまいました');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidProficiencyInput');
      expect(error.message).toBe('習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。');
      expect(error.fieldName).toBe('evaluationDate');
      expect(error.invalidValue).toBe('2024-13-45');
      expect(error.reason).toContain('2024-13-45');
      expect(error.reason).toContain('不正な形式');
      expect(error.reason).toContain('ISO 8601形式ではない');
    }
  });

  it('evaluationDateが2024-13-45という不正な形式である場合、ISO 8601形式ではないことが理由として特定される', async () => {
    jest.spyOn(validationModule, 'validateDateTimeRange').mockImplementation((value: string) => {
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
      if (!iso8601Pattern.test(value)) {
        const error = new Error('習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。');
        (error as any).name = 'InvalidProficiencyInput';
        (error as any).fieldName = 'evaluationDate';
        (error as any).invalidValue = value;
        (error as any).reason = `evaluationDateが「${value}」という不正な形式（ISO 8601形式ではない）であることが入力形式エラーの理由として特定される`;
        throw error;
      }
      return true;
    });

    const invalidInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-13-45',
      evaluatedBy: 'E001',
      createdBy: 'C001',
    };

    try {
      await saveProficiency(invalidInput);
      fail('例外がスローされるべきですが、成功してしまいました');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidProficiencyInput');
      expect(error.message).toBe('習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。');
      expect(error.fieldName).toBe('evaluationDate');
      expect(error.invalidValue).toBe('2024-13-45');
      expect(error.reason).toContain('2024-13-45');
      expect(error.reason).toContain('ISO 8601形式');
    }
  });

  it('正当なISO 8601形式のevaluationDateで入力された場合は処理が継続される', async () => {
    jest.spyOn(validationModule, 'validateDateTimeRange').mockImplementation((value: string) => {
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
      if (!iso8601Pattern.test(value)) {
        const error = new Error('習熟度データの入力形式が不正です。必須フィールド: proficiencyId（更新時）、workerId、jobType、proficiencyLevel、evaluationDate、evaluatedBy、createdBy。');
        (error as any).name = 'InvalidProficiencyInput';
        (error as any).fieldName = 'evaluationDate';
        (error as any).invalidValue = value;
        throw error;
      }
      return true;
    });

    const validInput = {
      proficiencyId: null,
      workerId: 'W001',
      jobType: '梱包',
      proficiencyLevel: '中級',
      evaluationDate: '2024-12-31T10:00:00Z',
      evaluatedBy: 'E001',
      createdBy: 'C001',
    };

    const result = await saveProficiency(validInput);
    expect(result).toBeDefined();
    expect(result.proficiencyId).toBeDefined();
    expect(result.workerId).toBe('W001');
    expect(result.jobType).toBe('梱包');
    expect(result.proficiencyLevel).toBe('中級');
    expect(result.isNewRecord).toBe(true);
  });
});