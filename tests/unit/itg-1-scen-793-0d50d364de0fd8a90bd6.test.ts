import { listAllocationPlansByCondition, DatabaseAccessError } from '../../src/logic/data-persistence';
import { ListAllocationPlansByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-793: listAllocationPlansByCondition - Database Access Error', () => {
  it('should throw DatabaseAccessError with correct message when database connection fails', async () => {
    const input: ListAllocationPlansByConditionInput = {
      statuses: ['提案中'],
    };

    let errorThrown: Error | undefined;
    let outputReturned: any;

    try {
      outputReturned = await listAllocationPlansByCondition(input);
      fail('Expected DatabaseAccessError to be thrown');
    } catch (error) {
      errorThrown = error as Error;
      expect(error).toBeInstanceOf(DatabaseAccessError);
      expect((error as DatabaseAccessError).message).toBe(
        '人員配置案データの検索に失敗しました。システム管理者に連絡してください。'
      );
    }

    // Verify that DatabaseAccessError was thrown (not some other error)
    expect(errorThrown).toBeDefined();
    expect(errorThrown).toBeInstanceOf(DatabaseAccessError);

    // Verify that no output was returned due to the error
    expect(outputReturned).toBeUndefined();
  });
});