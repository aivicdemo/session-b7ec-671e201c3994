import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-740: calculateDateTimeValues - schedule_judgment with threshold equal to days until target', () => {
  it('should return isWithinThreshold as true when daysUntilTarget equals thresholdDays', () => {
    const result = calculateDateTimeValues({
      calculationType: 'schedule_judgment',
      referenceDate: '2024-01-15',
      targetDate: '2024-01-20',
      thresholdDays: 5,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
    });

    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('schedule_judgment');
    expect(result.daysUntilTarget).toBe(5);
    expect(result.isWithinThreshold).toBe(true);
    expect(result.error).toBeNull();
  });
});