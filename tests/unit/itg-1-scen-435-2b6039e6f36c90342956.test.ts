import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-435: calculateWorkHours - Invalid DateTime Range Error', () => {
  it('should throw InvalidDateTimeRangeError when startDateTime is after endDateTime', async () => {
    const input = {
      startDateTime: '2024-01-15T15:00:00+09:00',
      endDateTime: '2024-01-15T14:00:00+09:00',
    };

    let errorThrown: Error | undefined;
    try {
      await calculateWorkHours(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).toBeDefined();
    expect(errorThrown?.name).toBe('InvalidDateTimeRangeError');
    expect(errorThrown?.message).toBe('作業開始日時は作業終了日時より前である必要があります。');
  });
});