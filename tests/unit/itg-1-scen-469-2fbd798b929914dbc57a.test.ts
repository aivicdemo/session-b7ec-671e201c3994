import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('作業進捗・人員配置最適化エンジン - SCEN-469', () => {
  it('職務区分が空文字列またはnullである場合、職務区分未指定エラーが発生する', async () => {
    const input = {
      workerId: 'W001',
      jobType: '',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        { workDate: '2024-01-14', productivityRate: 50, qualityScore: 85 },
        { workDate: '2024-01-13', productivityRate: 48, qualityScore: 82 },
        { workDate: '2024-01-12', productivityRate: 52, qualityScore: 88 },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeProficiencyLevel(input)).rejects.toThrow('職務区分が指定されていません。');
  });
});