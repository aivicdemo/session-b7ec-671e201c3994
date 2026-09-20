import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-433: calculateWorkHours - Invalid DateTime Format Error', () => {
  it('should reject invalid ISO 8601 format for startDateTime with InvalidDateTimeFormatError', () => {
    const invalidInput = {
      startDateTime: '2024/01/15 09:00:00',
      endDateTime: '2024-01-15T10:00:00Z',
    };

    expect(() => calculateWorkHours(invalidInput)).toThrow(
      expect.objectContaining({
        name: expect.stringMatching(/InvalidDateTimeFormatError|Error/),
        message: expect.stringContaining(
          '作業開始日時または作業終了日時の形式が不正です。ISO 8601形式で指定してください。'
        ),
      })
    );
  });

  it('should reject partial date format for startDateTime', () => {
    const invalidInput = {
      startDateTime: '2024-01-15',
      endDateTime: '2024-01-15T10:00:00Z',
    };

    expect(() => calculateWorkHours(invalidInput)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          '作業開始日時または作業終了日時の形式が不正です。ISO 8601形式で指定してください。'
        ),
      })
    );
  });

  it('should reject invalid ISO 8601 format for endDateTime', () => {
    const invalidInput = {
      startDateTime: '2024-01-15T09:00:00Z',
      endDateTime: '2024/01/15 10:00:00',
    };

    expect(() => calculateWorkHours(invalidInput)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          '作業開始日時または作業終了日時の形式が不正です。ISO 8601形式で指定してください。'
        ),
      })
    );
  });

  it('should reject both invalid datetime formats', () => {
    const invalidInput = {
      startDateTime: '2024/01/15 09:00:00',
      endDateTime: '2024/01/15 10:00:00',
    };

    expect(() => calculateWorkHours(invalidInput)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          '作業開始日時または作業終了日時の形式が不正です。ISO 8601形式で指定してください。'
        ),
      })
    );
  });
});