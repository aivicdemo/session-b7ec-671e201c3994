import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('作業者の習熟度レベル判定 - エラーハンドリング', () => {
  it('評価日時が現在日時より未来であるか形式が不正である場合、無効日時エラーが発生する', async () => {
    // 現在日時より未来の日時を設定
    const futureDateTime = '2099-12-31T23:59:59Z';
    
    const input = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: futureDateTime,
      pastProductivityRecords: [
        {
          workDate: '2024-01-01',
          productivityRate: 10,
          qualityScore: 85
        },
        {
          workDate: '2024-01-02',
          productivityRate: 11,
          qualityScore: 87
        },
        {
          workDate: '2024-01-03',
          productivityRate: 12,
          qualityScore: 90
        }
      ],
      lookbackDays: 90,
      timeZone: 'UTC'
    };

    // 無効日時エラーが発生することを確認
    await expect(judgeProficiencyLevel(input)).rejects.toThrow();
    
    try {
      await judgeProficiencyLevel(input);
      fail('エラーが発生するはずです');
    } catch (error: any) {
      // エラーメッセージが指定のメッセージであることを確認
      expect(error.message).toBe('評価日時が無効です。現在日時以前の有効な日時を指定してください。');
    }
  });
});