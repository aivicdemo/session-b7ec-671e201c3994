import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';

describe('validateDateTimeRange', () => {
  describe('SCEN-384: カスタム営業時間内で開始・終了日時が指定されたとき、正常に検証完了する', () => {
    it('should validate datetime range within custom business hours successfully', async () => {
      const input = {
        startDateTime: '2025-01-15T08:00:00Z',
        endDateTime: '2025-01-15T17:00:00Z',
        businessHoursStart: '08:00',
        businessHoursEnd: '18:00',
        allowPastDateTime: false,
        maxDurationDays: 365,
        timeZone: 'Asia/Tokyo',
      };

      const result = await validateDateTimeRange(input);

      expect(result.isValid).toBe(true);
      expect(result.normalizedStartDateTime).toBe('2025-01-15T08:00:00Z');
      expect(result.normalizedEndDateTime).toBe('2025-01-15T17:00:00Z');
      expect(result.durationMinutes).toBe(540);
      expect(result.violatedRules).toEqual([]);
    });
  });
});