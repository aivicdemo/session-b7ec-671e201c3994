import { calculateDelayDays } from '../../src/logic/validation-common-calculation';

describe('SCEN-428: calculateDelayDays - Missing Required Date Error', () => {
  it('should throw MissingRequiredDateError when plannedEndDateTime is null', async () => {
    const actualEndDateTime = '2024-01-15T18:00:00Z';
    const plannedEndDateTime = null;

    await expect(
      calculateDelayDays({
        actualEndDateTime,
        plannedEndDateTime: plannedEndDateTime as any,
      })
    ).rejects.toThrow('実績終了日時と予定終了日時は必須です。');
  });

  it('should throw MissingRequiredDateError when plannedEndDateTime is undefined', async () => {
    const actualEndDateTime = '2024-01-15T18:00:00Z';

    await expect(
      calculateDelayDays({
        actualEndDateTime,
        plannedEndDateTime: undefined as any,
      })
    ).rejects.toThrow('実績終了日時と予定終了日時は必須です。');
  });
});