import { validateDateTimeRange } from '../../src/logic/validation-common-calculation';
import * as validationCommonCalculation from '../../src/logic/validation-common-calculation';

describe('SCEN-377: validateDateTimeRange - Valid datetime range with normalization', () => {
  it('should return valid result with normalized datetimes and correct duration minutes', () => {
    const mockNormalizeDateTime = jest.spyOn(validationCommonCalculation, 'normalizeDateTime' as any);
    
    // Set up mock return values for normalizeDateTime calls
    mockNormalizeDateTime.mockReturnValueOnce({
      normalizedDateTime: '2025-01-15T09:00:00+09:00',
      originalDateTime: '2025-01-15T09:00:00Z',
      detectedFormat: 'iso8601',
      detectedTimeZone: 'UTC',
      unixTimestampMs: 1736923200000,
      isValid: true,
    }).mockReturnValueOnce({
      normalizedDateTime: '2025-01-15T17:30:00+09:00',
      originalDateTime: '2025-01-15T17:30:00Z',
      detectedFormat: 'iso8601',
      detectedTimeZone: 'UTC',
      unixTimestampMs: 1736955000000,
      isValid: true,
    });
    
    const mockInput = {
      startDateTime: '2025-01-15T09:00:00Z',
      endDateTime: '2025-01-15T17:30:00Z',
      allowPastDateTime: false,
      businessHoursStart: '06:00',
      businessHoursEnd: '22:00',
      maxDurationDays: 365,
      timeZone: 'Asia/Tokyo',
    };

    const result = validateDateTimeRange(mockInput);

    // Verify normalizeDateTime was called
    expect(mockNormalizeDateTime).toHaveBeenCalled();
    expect(mockNormalizeDateTime).toHaveBeenCalledTimes(2);

    // Verify the result
    expect(result.isValid).toBe(true);
    expect(result.normalizedStartDateTime).toBe('2025-01-15T09:00:00+09:00');
    expect(result.normalizedEndDateTime).toBe('2025-01-15T17:30:00+09:00');
    expect(result.durationMinutes).toBe(510);
    expect(result.violatedRules).toEqual([]);
    
    mockNormalizeDateTime.mockRestore();
  });
});