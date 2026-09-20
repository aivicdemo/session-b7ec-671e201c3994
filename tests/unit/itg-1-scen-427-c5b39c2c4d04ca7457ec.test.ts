import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-427: calculateDelayDays - Error Handling', () => {
  describe('actualEndDateTime がnullの場合', () => {
    it('MissingRequiredDateErrorが発生し、エラー文言が「実績終了日時と予定終了日時は必須です。」であること', () => {
      const input = {
        actualEndDateTime: null as any,
        plannedEndDateTime: '2024-01-15T09:00:00Z',
        timeZone: 'UTC',
      };

      expect(() => {
        calculateDelayDays(input);
      }).toThrow();

      try {
        calculateDelayDays(input);
      } catch (error: any) {
        expect(error.name).toBe('MissingRequiredDateError');
        expect(error.message).toBe('実績終了日時と予定終了日時は必須です。');
      }
    });
  });

  describe('actualEndDateTime がundefinedの場合', () => {
    it('MissingRequiredDateErrorが発生し、エラー文言が「実績終了日時と予定終了日時は必須です。」であること', () => {
      const input = {
        actualEndDateTime: undefined as any,
        plannedEndDateTime: '2024-01-15T09:00:00Z',
        timeZone: 'UTC',
      };

      expect(() => {
        calculateDelayDays(input);
      }).toThrow();

      try {
        calculateDelayDays(input);
      } catch (error: any) {
        expect(error.name).toBe('MissingRequiredDateError');
        expect(error.message).toBe('実績終了日時と予定終了日時は必須です。');
      }
    });
  });
});