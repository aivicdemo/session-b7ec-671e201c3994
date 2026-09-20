import { judgeProficiencyLevel } from '../../src/logic/validation-common-calculation';

describe('SCEN-471: 習熟度レベル判定 - 生産性指標無効エラー', () => {
  it('should throw InvalidProductivityMetricsError when productivityRate is negative', async () => {
    // Arrange
    const input = {
      workerId: 'W001',
      jobType: 'ピッキング',
      evaluationDateTime: '2024-03-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-15',
          productivityRate: -5.0,
          qualityScore: 85,
        },
        {
          workDate: '2024-01-22',
          productivityRate: 45.5,
          qualityScore: 90,
        },
        {
          workDate: '2024-01-29',
          productivityRate: 48.0,
          qualityScore: 88,
        },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    // Act & Assert
    await expect(judgeProficiencyLevel(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProductivityMetricsError',
        message: expect.stringContaining('生産性指標の値が無効です'),
      })
    );
  });

  it('should throw InvalidProductivityMetricsError when qualityScore is below 0', async () => {
    // Arrange
    const input = {
      workerId: 'W002',
      jobType: '梱包',
      evaluationDateTime: '2024-03-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-15',
          productivityRate: 40.0,
          qualityScore: -10,
        },
        {
          workDate: '2024-01-22',
          productivityRate: 45.5,
          qualityScore: 90,
        },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    // Act & Assert
    await expect(judgeProficiencyLevel(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProductivityMetricsError',
        message: expect.stringContaining('生産性指標の値が無効です'),
      })
    );
  });

  it('should throw InvalidProductivityMetricsError when qualityScore exceeds 100', async () => {
    // Arrange
    const input = {
      workerId: 'W003',
      jobType: '検品',
      evaluationDateTime: '2024-03-15T10:00:00Z',
      pastProductivityRecords: [
        {
          workDate: '2024-01-15',
          productivityRate: 50.0,
          qualityScore: 105,
        },
        {
          workDate: '2024-01-22',
          productivityRate: 45.5,
          qualityScore: 90,
        },
      ],
      lookbackDays: 90,
      timeZone: 'Asia/Tokyo',
    };

    // Act & Assert
    await expect(judgeProficiencyLevel(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidProductivityMetricsError',
        message: expect.stringContaining('生産性指標の値が無効です'),
      })
    );
  });
});