import { findComparisonAnalysisResultByName } from '../../src/logic/persistence-layer';
import { jest } from '@jest/globals';\

describe('findComparisonAnalysisResultByName - SCEN-692', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAnalysisName error when analysisName is null', async () => {
    const input = {
      analysisName: null,
      requestingUserId: 'user-001',
    };

    let thrownError: any;
    try {
      await findComparisonAnalysisResultByName(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError.code).toBe('InvalidAnalysisName');
    expect(thrownError.message).toBe('分析名は必須項目です。');
    
    // Verify that only error-related fields are present, no data fields
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'comparisonAnalysisResultId')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'analysisName')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'analysisType')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'found')).toBe(false);
  });
});