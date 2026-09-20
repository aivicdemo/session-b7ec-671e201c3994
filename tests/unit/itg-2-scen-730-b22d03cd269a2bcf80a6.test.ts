import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('calculateDateTimeValues', () => {
  describe('期間日数計算', () => {
    it('開始日と終了日を指定すると日数が返される', () => {
      const result = calculateDateTimeValues({
        calculationType: 'period_days',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        startTime: null,
        endTime: null,
        referenceDate: null,
        targetDate: null,
        thresholdDays: null,
      });

      expect(result.success).toBe(true);
      expect(result.calculationType).toBe('period_days');
      expect(result.periodDays).toBe(5);
      expect(result.periodMinutes).toBeNull();
      expect(result.timeDifferenceMinutes).toBeNull();
      expect(result.isWithinThreshold).toBeNull();
      expect(result.daysUntilTarget).toBeNull();
      expect(result.error).toBeNull();
    });
  });
});