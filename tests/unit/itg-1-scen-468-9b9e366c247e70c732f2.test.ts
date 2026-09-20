import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-468: 作業者習熟度レベル判定 - 作業者ID未指定エラー', () => {
  it('作業者IDが空文字列の場合、InvalidWorkerIdErrorが発生する', async () => {
    const input = {
      workerId: '',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        { workDate: '2024-01-01', productivityRate: 50, qualityScore: 85 },
        { workDate: '2024-01-08', productivityRate: 52, qualityScore: 87 },
        { workDate: '2024-01-15', productivityRate: 51, qualityScore: 86 },
      ],
    };

    await expect(judgeProficiencyLevel(input)).rejects.toThrow('作業者IDが指定されていません。');
  });

  it('作業者IDがnullの場合、InvalidWorkerIdErrorが発生する', async () => {
    const input = {
      workerId: null as any,
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [
        { workDate: '2024-01-01', productivityRate: 50, qualityScore: 85 },
        { workDate: '2024-01-08', productivityRate: 52, qualityScore: 87 },
        { workDate: '2024-01-15', productivityRate: 51, qualityScore: 86 },
      ],
    };

    await expect(judgeProficiencyLevel(input)).rejects.toThrow('作業者IDが指定されていません。');
  });
});