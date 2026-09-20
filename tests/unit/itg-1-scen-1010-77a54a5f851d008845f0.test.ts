import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1010: 定義済み値以外の対応状況を指定した場合はエラーを返す', () => {
  it('actionStatuses に未定義の値を指定した場合、InvalidConditionFormatError をスローする', async () => {
    const input = {
      actionStatuses: ['undefined_status', 'invalid_action'],
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。',
      })
    );
  });

  it('actionStatuses に部分的に未定義の値を含めた場合、InvalidConditionFormatError をスローする', async () => {
    const input = {
      actionStatuses: ['未対応', 'invalid_status'],
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。',
      })
    );
  });

  it('actionStatuses に空文字列を指定した場合、InvalidConditionFormatError をスローする', async () => {
    const input = {
      actionStatuses: [''],
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。',
      })
    );
  });

  it('他の検索条件が有効で actionStatuses のみ未定義の値の場合、InvalidConditionFormatError をスローする', async () => {
    const input = {
      riskJudgmentIds: ['risk-001', 'risk-002'],
      workInstructionIds: ['work-001'],
      facilityIds: ['facility-001'],
      teamIds: ['team-001'],
      riskLevels: ['HIGH', 'MEDIUM'],
      actionStatuses: ['未対応', 'unknown_status'],
      minDelayPredictionDays: 1,
      maxDelayPredictionDays: 10,
      minProgressRate: 0,
      maxProgressRate: 100,
      judgmentDateFromDateTime: '2024-01-01T00:00:00Z',
      judgmentDateToDateTime: '2024-12-31T23:59:59Z',
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: 'judgmentDateTime',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        message: '検索条件の形式が不正です。日時範囲とリスクレベル・ステータス値を確認してください。',
      })
    );
  });
});