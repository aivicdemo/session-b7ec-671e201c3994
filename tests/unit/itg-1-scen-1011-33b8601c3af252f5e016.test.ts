import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1011: 不正な日時形式を指定した場合はエラーを返す', () => {
  it('should throw InvalidConditionFormatError when judgmentDateFromDateTime has invalid format', async () => {
    const invalidInput = {
      judgmentDateFromDateTime: '2024-13-45T25:70:90Z',
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listDelayRiskJudgmentByCondition(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: expect.stringContaining(
          '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。'
        ),
      })
    );
  });

  it('should throw InvalidConditionFormatError when judgmentDateFromDateTime is "invalid-date"', async () => {
    const invalidInput = {
      judgmentDateFromDateTime: 'invalid-date',
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listDelayRiskJudgmentByCondition(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: expect.stringContaining(
          '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。'
        ),
      })
    );
  });

  it('should throw InvalidConditionFormatError when judgmentDateFromDateTime uses non-ISO8601 format (YYYY/MM/DD)', async () => {
    const invalidInput = {
      judgmentDateFromDateTime: '2024/01/01',
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listDelayRiskJudgmentByCondition(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: expect.stringContaining(
          '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。'
        ),
      })
    );
  });

  it('should throw InvalidConditionFormatError when judgmentDateToDateTime has invalid format', async () => {
    const invalidInput = {
      judgmentDateToDateTime: 'not-a-date',
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listDelayRiskJudgmentByCondition(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: expect.stringContaining(
          '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。'
        ),
      })
    );
  });
});