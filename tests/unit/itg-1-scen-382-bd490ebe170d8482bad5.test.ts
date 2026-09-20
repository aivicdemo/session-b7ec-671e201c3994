import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('SCEN-382: allowPastDateTimeがfalseで開始日時が現在時刻より前のとき、PastDateTimeErrorが発生する', () => {
  it('should return isValid=false with PastDateTimeError when startDateTime is before current time and allowPastDateTime=false', () => {
    // 現在時刻を基準として、過去の日時を作成
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const startDateTime = oneHourAgo.toISOString();
    const endDateTime = twoHoursLater.toISOString();

    // validateDateTimeRange関数を呼び出す
    const result = validateDateTimeRange({
      startDateTime,
      endDateTime,
      allowPastDateTime: false,
      // businessHoursStart、businessHoursEnd、maxDurationDays、timeZoneはデフォルト値を使用
    });

    // 期待結果を検証
    expect(result.isValid).toBe(false);
    expect(result.violatedRules.length).toBeGreaterThan(0);
    expect(result.violatedRules).toContain('PastDateTimeError');
  });
});