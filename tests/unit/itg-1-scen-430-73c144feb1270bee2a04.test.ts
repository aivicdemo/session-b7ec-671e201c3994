import { calculateDelayDays } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('SCEN-430: calculateDelayDays with default timezone', () => {
  let normalizeDateTimeStub: jest.SpyInstance;
  let calculateDurationMinutesStub: jest.SpyInstance;

  beforeEach(() => {
    normalizeDateTimeStub = jest.spyOn(validationModule, 'normalizeDateTime' as any);
    calculateDurationMinutesStub = jest.spyOn(validationModule, 'calculateDurationMinutes' as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should apply default UTC timezone when timeZone parameter is omitted', async () => {
    const actualEndDateTime = '2024-01-15T14:30:00Z';
    const plannedEndDateTime = '2024-01-15T10:00:00Z';

    normalizeDateTimeStub.mockImplementation((input: any) => {
      if (input.dateTimeValue === actualEndDateTime) {
        return {
          normalizedDateTime: '2024-01-15T14:30:00Z',
          originalDateTime: actualEndDateTime,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705334400000,
          isValid: true,
        };
      }
      if (input.dateTimeValue === plannedEndDateTime) {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: plannedEndDateTime,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705319400000,
          isValid: true,
        };
      }
      return {
        normalizedDateTime: input.dateTimeValue,
        originalDateTime: input.dateTimeValue,
        detectedFormat: 'iso8601',
        detectedTimeZone: 'UTC',
        unixTimestampMs: 0,
        isValid: true,
      };
    });

    calculateDurationMinutesStub.mockReturnValue(270);

    const result = await calculateDelayDays({
      actualEndDateTime,
      plannedEndDateTime,
    });

    expect(normalizeDateTimeStub).toHaveBeenCalled();
    expect(calculateDurationMinutesStub).toHaveBeenCalled();

    const normalizeCalls = normalizeDateTimeStub.mock.calls;
    expect(normalizeCalls.length).toBeGreaterThanOrEqual(2);
    
    const normalizeCallsWithUtc = normalizeCalls.filter((call: any[]) => {
      const arg = call[0];
      return arg && arg.inputTimeZone === 'UTC';
    });
    expect(normalizeCallsWithUtc.length).toBeGreaterThan(0);

    const durationCalls = calculateDurationMinutesStub.mock.calls;
    expect(durationCalls.length).toBeGreaterThan(0);
    const durationCallArg = durationCalls[0][0];
    expect(durationCallArg).toBeDefined();
    expect(durationCallArg.timeZone).toBe('UTC');

    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });

  it('should calculate positive delay when actual end is after planned end', async () => {
    const actualEndDateTime = '2024-01-15T14:30:00Z';
    const plannedEndDateTime = '2024-01-15T10:00:00Z';

    normalizeDateTimeStub.mockImplementation((input: any) => {
      if (input.dateTimeValue === actualEndDateTime) {
        return {
          normalizedDateTime: '2024-01-15T14:30:00Z',
          originalDateTime: actualEndDateTime,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705334400000,
          isValid: true,
        };
      }
      if (input.dateTimeValue === plannedEndDateTime) {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: plannedEndDateTime,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705319400000,
          isValid: true,
        };
      }
      return {
        normalizedDateTime: input.dateTimeValue,
        originalDateTime: input.dateTimeValue,
        detectedFormat: 'iso8601',
        detectedTimeZone: 'UTC',
        unixTimestampMs: 0,
        isValid: true,
      };
    });

    calculateDurationMinutesStub.mockReturnValue(270);

    const result = await calculateDelayDays({
      actualEndDateTime,
      plannedEndDateTime,
    });

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should distinguish between early completion and delay', async () => {
    const earlyActualEnd = '2024-01-15T08:00:00Z';
    const plannedEnd = '2024-01-15T10:00:00Z';

    normalizeDateTimeStub.mockImplementation((input: any) => {
      if (input.dateTimeValue === earlyActualEnd) {
        return {
          normalizedDateTime: '2024-01-15T08:00:00Z',
          originalDateTime: earlyActualEnd,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705326000000,
          isValid: true,
        };
      }
      if (input.dateTimeValue === plannedEnd) {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: plannedEnd,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705333200000,
          isValid: true,
        };
      }
      return {
        normalizedDateTime: input.dateTimeValue,
        originalDateTime: input.dateTimeValue,
        detectedFormat: 'iso8601',
        detectedTimeZone: 'UTC',
        unixTimestampMs: 0,
        isValid: true,
      };
    });

    calculateDurationMinutesStub.mockReturnValue(-120);

    const earlyResult = await calculateDelayDays({
      actualEndDateTime: earlyActualEnd,
      plannedEndDateTime: plannedEnd,
    });

    expect(earlyResult).toBeLessThan(0);

    const lateActualEnd = '2024-01-15T14:30:00Z';

    normalizeDateTimeStub.mockImplementation((input: any) => {
      if (input.dateTimeValue === lateActualEnd) {
        return {
          normalizedDateTime: '2024-01-15T14:30:00Z',
          originalDateTime: lateActualEnd,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705334400000,
          isValid: true,
        };
      }
      if (input.dateTimeValue === plannedEnd) {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: plannedEnd,
          detectedFormat: 'iso8601',
          detectedTimeZone: 'UTC',
          unixTimestampMs: 1705333200000,
          isValid: true,
        };
      }
      return {
        normalizedDateTime: input.dateTimeValue,
        originalDateTime: input.dateTimeValue,
        detectedFormat: 'iso8601',
        detectedTimeZone: 'UTC',
        unixTimestampMs: 0,
        isValid: true,
      };
    });

    calculateDurationMinutesStub.mockReturnValue(270);

    const delayResult = await calculateDelayDays({
      actualEndDateTime: lateActualEnd,
      plannedEndDateTime: plannedEnd,
    });

    expect(delayResult).toBeGreaterThan(0);
  });
});