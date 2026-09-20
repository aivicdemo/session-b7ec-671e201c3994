import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-437: calculateWorkHours with past datetime restriction', () => {
  it('should reject past startDateTime when allowPastDateTime is false', async () => {
    // 現在時刻を基準に過去の日時を設定
    const now = new Date();
    const pastTime = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4時間前
    const endTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3時間前

    const pastStartDateTime = pastTime.toISOString();
    const endDateTime = endTime.toISOString();

    try {
      await calculateWorkHours({
        startDateTime: pastStartDateTime,
        endDateTime: endDateTime,
        allowPastDateTime: false,
      });
      fail('Expected PastDateTimeError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PastDateTimeError');
      expect(error.message).toBe('過去の日時は指定できません。');
    }
  });
});