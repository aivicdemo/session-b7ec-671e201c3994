import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-439: calculateWorkHours with business hours adjustment', () => {
  it('should reject with OutsideBusinessHoursError when endDateTime is outside business hours and applyBusinessHoursAdjustment is true', () => {
    const input = {
      startDateTime: '2024-01-15T14:30:00+09:00',
      endDateTime: '2024-01-15T19:00:00+09:00',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      applyBusinessHoursAdjustment: true,
    };

    expect(() => {
      calculateWorkHours(input);
    }).toThrow();

    try {
      calculateWorkHours(input);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.name).toBe('OutsideBusinessHoursError');
        expect(error.message).toBe('作業時間は営業時間内（09:00～18:00）である必要があります。');
      }
    }
  });
});