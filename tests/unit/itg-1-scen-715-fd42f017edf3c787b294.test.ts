import { getWorkResultById } from '../../src/logic/data-persistence';

describe('SCEN-715: 作業実績IDが空文字列の場合のエラー処理', () => {
  it('should throw InvalidWorkResultIdエラーが発生し、エラー文言は「Work result ID must not be empty.」である', async () => {
    const input = {
      workResultId: ''
    };

    try {
      await getWorkResultById(input);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidWorkResultIdError');
      expect(error.message).toBe('Work result ID must not be empty.');
    }
  });

  it('should throw InvalidWorkResultIdエラーwhen workResultId is null', async () => {
    const input = {
      workResultId: null
    };

    try {
      await getWorkResultById(input);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidWorkResultIdError');
      expect(error.message).toBe('Work result ID must not be empty.');
    }
  });

  it('should throw InvalidWorkResultIdエラーwhen workResultId is undefined', async () => {
    const input = {
      workResultId: undefined
    };

    try {
      await getWorkResultById(input);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.name).toBe('InvalidWorkResultIdError');
      expect(error.message).toBe('Work result ID must not be empty.');
    }
  });

  it('should validate input before database search', async () => {
    const input = {
      workResultId: ''
    };

    const startTime = Date.now();
    
    try {
      await getWorkResultById(input);
      fail('Expected error to be thrown');
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(error.name).toBe('InvalidWorkResultIdError');
      expect(error.message).toBe('Work result ID must not be empty.');
      // Input validation should happen before DB search, so execution should be very fast
      expect(executionTime).toBeLessThan(100);
    }
  });
});