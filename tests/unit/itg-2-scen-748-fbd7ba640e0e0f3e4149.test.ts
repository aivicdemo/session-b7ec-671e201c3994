import { calculateNumericMetrics } from '../../src/logic/authorization-and-validation';
import * as authModule from '../../src/logic/authorization-and-validation';

describe('SCEN-748: calculateNumericMetrics error handling', () => {
  it('should return error message when plannedTime is 0 or below during productivity_rate calculation', async () => {
    const validateInputDataSpy = jest.spyOn(authModule, 'validateInputData' as any).mockImplementation(() => {
      const error = new Error('計算入力値が不正です: plannedTime = 0');
      (error as any).name = 'InvalidInputValuesError';
      throw error;
    });
    
    const input = {
      metricType: 'productivity_rate',
      plannedTime: 0,
      actualTime: 480,
      decimalPlaces: 2,
    };

    const result = await calculateNumericMetrics(input);

    expect(result.success).toBe(false);
    expect(result.metricType).toBe('productivity_rate');
    expect(result.calculatedValue).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.isWithinValidRange).toBeNull();
    expect(result.validationMessage).toBeNull();
    expect(result.error).toBe('計算入力値が不正です: plannedTime = 0');
    expect(validateInputDataSpy).toHaveBeenCalled();
    
    validateInputDataSpy.mockRestore();
  });
});