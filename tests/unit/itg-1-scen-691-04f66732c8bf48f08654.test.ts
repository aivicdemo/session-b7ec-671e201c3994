import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';
import { ListWorkInstructionsByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-691: listWorkInstructionsByCondition - Database Connection Failure', () => {
  it('should throw DataAccessError when database connection fails', async () => {
    const input: ListWorkInstructionsByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock database connection failure
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Connection timeout')
    );

    try {
      await listWorkInstructionsByCondition(input);
      fail('Expected DataAccessError to be thrown');
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.message).toBe(
        '作業指示データの取得に失敗しました。システム管理者に連絡してください。'
      );
      expect(error.name).toBe('DataAccessError');
    }
  });

  it('should not return output when database connection fails', async () => {
    const input: ListWorkInstructionsByConditionInput = {
      facilityIds: ['F001'],
      pageNumber: 1,
      pageSize: 10,
    };

    // Mock database connection failure
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Connection refused')
    );

    let result: any;
    try {
      result = await listWorkInstructionsByCondition(input);
      fail('Expected exception to be thrown');
    } catch (error: any) {
      expect(result).toBeUndefined();
      expect(error).toMatchObject({
        name: 'DataAccessError',
        message: '作業指示データの取得に失敗しました。システム管理者に連絡してください。',
      });
    }
  });
});