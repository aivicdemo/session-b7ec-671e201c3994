import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('itg-1-scen-1009: listDelayRiskJudgmentByCondition - 定義済み値以外のリスクレベルを指定時のエラー', () => {
  it('定義済み値以外のリスクレベルを指定した場合はInvalidConditionFormatErrorをスロー', async () => {
    const input = {
      riskLevels: ['HIGH', 'INVALID_LEVEL'],
    };

    try {
      const result = await listDelayRiskJudgmentByCondition(input);
      
      if (result && typeof result === 'object' && 'name' in result && result.name === 'InvalidConditionFormatError') {
        expect(result.name).toBe('InvalidConditionFormatError');
        expect(result.message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else {
        throw new Error('Expected InvalidConditionFormatError to be thrown or returned');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'InvalidConditionFormatError') {
        expect(error.message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'InvalidConditionFormatError') {
        expect((error as any).message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else {
        throw error;
      }
    }
  });

  it('複数の定義済み値以外の値を指定した場合もInvalidConditionFormatErrorをスロー', async () => {
    const input = {
      riskLevels: ['INVALID_LEVEL_1', 'INVALID_LEVEL_2'],
    };

    try {
      const result = await listDelayRiskJudgmentByCondition(input);
      
      if (result && typeof result === 'object' && 'name' in result && result.name === 'InvalidConditionFormatError') {
        expect(result.name).toBe('InvalidConditionFormatError');
        expect(result.message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else {
        throw new Error('Expected InvalidConditionFormatError to be thrown or returned');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'InvalidConditionFormatError') {
        expect(error.message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'InvalidConditionFormatError') {
        expect((error as any).message).toBe('検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。');
      } else {
        throw error;
      }
    }
  });
});