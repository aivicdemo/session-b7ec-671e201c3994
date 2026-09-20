import { calculateDateTimeValues } from '../../src/logic/authorization-and-validation';

describe('SCEN-731: 期間分数計算で開始日時と終了日時を指定すると分数が返される', () => {
  it('should calculate period minutes correctly when given start and end dates', () => {
    // Arrange
    const input = {
      calculationType: 'period_minutes',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      startTime: null,
      endTime: null,
      referenceDate: null,
      targetDate: null,
      thresholdDays: null,
    };

    // Act
    const result = calculateDateTimeValues(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.calculationType).toBe('period_minutes');
    expect(result.periodMinutes).toBe(2880);
    expect(result.error).toBeNull();
  });
});