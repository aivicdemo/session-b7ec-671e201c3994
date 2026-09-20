import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';
import { JudgeProficiencyLevelInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-470: 過去実績データが存在しないか3件未満である場合、最小件数不足エラーが発生する', () => {
  it('過去実績データが0件（空配列）の場合、InsufficientProductivityDataError が発生する', () => {
    const input: JudgeProficiencyLevelInput = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-01-15T10:00:00Z',
      pastProductivityRecords: [],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeProficiencyLevel(input)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          '習熟度判定に必要な過去実績データが不足しています。'
        ),
      })
    );
  });
});