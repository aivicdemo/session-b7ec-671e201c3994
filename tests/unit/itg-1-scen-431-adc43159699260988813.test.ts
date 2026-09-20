import { calculateDelayDays, CalculateDelayDaysInput } from '../../src/logic/validation-common-calculation';
import * as validationModule from '../../src/logic/validation-common-calculation';

describe('SCEN-431: calculateDelayDaysのタイムゾーン処理', () => {
  it('有効なタイムゾーン識別子が指定された場合、そのタイムゾーンで計算が実行される', () => {
    // normalizeDateTime のスタブ化
    // actualEndDateTime用とplannedEndDateTime用で異なる結果を返す
    const normalizeDateTimeSpy = jest.spyOn(validationModule, 'normalizeDateTime' as any).mockImplementation((input: any) => {
      if (input.dateTimeValue === '2024-01-15T14:30:00Z') {
        return {
          normalizedDateTime: '2024-01-15T14:30:00Z',
          originalDateTime: '2024-01-15T14:30:00Z',
          detectedFormat: 'iso8601',
          detectedTimeZone: 'Asia/Tokyo',
          unixTimestampMs: 1705327800000,
          isValid: true,
        };
      } else if (input.dateTimeValue === '2024-01-15T10:00:00Z') {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: '2024-01-15T10:00:00Z',
          detectedFormat: 'iso8601',
          detectedTimeZone: 'Asia/Tokyo',
          unixTimestampMs: 1705312800000,
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

    // calculateDurationMinutes のスタブ化
    // 14:30:00 - 10:00:00 = 270分（4.5時間）
    const calculateDurationMinutesSpy = jest.spyOn(validationModule, 'calculateDurationMinutes' as any).mockReturnValue(270);

    const input: CalculateDelayDaysInput = {
      actualEndDateTime: '2024-01-15T14:30:00Z',
      plannedEndDateTime: '2024-01-15T10:00:00Z',
      timeZone: 'Asia/Tokyo',
    };

    const result = calculateDelayDays(input);

    // 戻り値の型を確認
    expect(typeof result).toBe('number');
    expect(result).toBeDefined();
    expect(Number.isFinite(result)).toBe(true);

    // 270分は約0.1875日（24時間未満）なので、遅延日数は0日となるべき
    // または計算方法によっては小数で返される可能性もある
    // スタブが270分を返すため、実装依存だが、正の数値であることを確認
    expect(result >= 0).toBe(true);

    // normalizeDateTime が呼び出されたことを確認
    expect(normalizeDateTimeSpy).toHaveBeenCalled();
    
    // calculateDurationMinutes が呼び出されたことを確認
    expect(calculateDurationMinutesSpy).toHaveBeenCalled();

    // normalizeDateTime呼び出し時に Asia/Tokyo タイムゾーンが引き渡されたことを確認
    const normalizeDateTimeCalls = normalizeDateTimeSpy.mock.calls;
    const hasTokyoInNormalize = normalizeDateTimeCalls.some((call) => {
      const arg = call[0] as any;
      return arg?.inputTimeZone === 'Asia/Tokyo' || arg?.outputTimeZone === 'Asia/Tokyo';
    });
    expect(hasTokyoInNormalize).toBe(true);

    // calculateDurationMinutes呼び出し時に Asia/Tokyo タイムゾーンが引き渡されたことを確認
    const calculateDurationMinutesCalls = calculateDurationMinutesSpy.mock.calls;
    const hasTokyoInDuration = calculateDurationMinutesCalls.some((call) => {
      const arg = call[0] as any;
      return arg?.timeZone === 'Asia/Tokyo';
    });
    expect(hasTokyoInDuration).toBe(true);

    normalizeDateTimeSpy.mockRestore();
    calculateDurationMinutesSpy.mockRestore();
  });

  it('早期完了（負の遅延日数）のケースで正しく計算される', () => {
    // normalizeDateTime のスタブ化
    const normalizeDateTimeSpy = jest.spyOn(validationModule, 'normalizeDateTime' as any).mockImplementation((input: any) => {
      if (input.dateTimeValue === '2024-01-15T08:00:00Z') {
        return {
          normalizedDateTime: '2024-01-15T08:00:00Z',
          originalDateTime: '2024-01-15T08:00:00Z',
          detectedFormat: 'iso8601',
          detectedTimeZone: 'Asia/Tokyo',
          unixTimestampMs: 1705305600000,
          isValid: true,
        };
      } else if (input.dateTimeValue === '2024-01-15T10:00:00Z') {
        return {
          normalizedDateTime: '2024-01-15T10:00:00Z',
          originalDateTime: '2024-01-15T10:00:00Z',
          detectedFormat: 'iso8601',
          detectedTimeZone: 'Asia/Tokyo',
          unixTimestampMs: 1705312800000,
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

    // calculateDurationMinutes のスタブ化
    // 08:00:00 - 10:00:00 = -120分（2時間早期完了）
    const calculateDurationMinutesSpy = jest.spyOn(validationModule, 'calculateDurationMinutes' as any).mockReturnValue(-120);

    const input: CalculateDelayDaysInput = {
      actualEndDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-15T10:00:00Z',
      timeZone: 'Asia/Tokyo',
    };

    const result = calculateDelayDays(input);

    // 戻り値の型を確認
    expect(typeof result).toBe('number');
    expect(result).toBeDefined();
    expect(Number.isFinite(result)).toBe(true);

    // 早期完了なので負の値が返されることを確認
    expect(result <= 0).toBe(true);

    // normalizeDateTime と calculateDurationMinutes が呼び出されたことを確認
    expect(normalizeDateTimeSpy).toHaveBeenCalled();
    expect(calculateDurationMinutesSpy).toHaveBeenCalled();

    // normalizeDateTime呼び出し時に Asia/Tokyo タイムゾーンが引き渡されたことを確認
    const normalizeDateTimeCalls = normalizeDateTimeSpy.mock.calls;
    const hasTokyoInNormalize = normalizeDateTimeCalls.some((call) => {
      const arg = call[0] as any;
      return arg?.inputTimeZone === 'Asia/Tokyo' || arg?.outputTimeZone === 'Asia/Tokyo';
    });
    expect(hasTokyoInNormalize).toBe(true);

    // calculateDurationMinutes呼び出し時に Asia/Tokyo タイムゾーンが引き渡されたことを確認
    const calculateDurationMinutesCalls = calculateDurationMinutesSpy.mock.calls;
    const hasTokyoInDuration = calculateDurationMinutesCalls.some((call) => {
      const arg = call[0] as any;
      return arg?.timeZone === 'Asia/Tokyo';
    });
    expect(hasTokyoInDuration).toBe(true);

    normalizeDateTimeSpy.mockRestore();
    calculateDurationMinutesSpy.mockRestore();
  });
});