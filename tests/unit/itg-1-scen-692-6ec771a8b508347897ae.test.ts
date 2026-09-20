import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';
import { ListWorkInstructionsByConditionInput, ListWorkInstructionsByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-692: 検索条件に合致する作業指示が存在しない場合は結果なし警告が発生する', () => {
  it('should return empty results with NoResultsFoundWarning when no work instructions match the search criteria', async () => {
    // Arrange
    const input: ListWorkInstructionsByConditionInput = {
      workInstructionIds: ['NON_EXISTENT_ID_001', 'NON_EXISTENT_ID_002'],
      pageNumber: 1,
      pageSize: 100,
    };

    // Act & Assert
    let result: ListWorkInstructionsByConditionOutput | undefined;
    let errorThrown: Error | undefined;

    try {
      result = await listWorkInstructionsByCondition(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    // Verify that NoResultsFoundWarning error was thrown
    expect(errorThrown).toBeDefined();
    expect(errorThrown?.name).toBe('NoResultsFoundWarning');
    expect(errorThrown?.message).toContain('指定された条件に合致する作業指示は見つかりませんでした。');

    // If result is still available despite the error, verify its structure
    if (result) {
      expect(Array.isArray(result.workInstructions)).toBe(true);
      expect(result.workInstructions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.retrievedAt).toBeDefined();
      
      // Validate retrievedAt is ISO 8601 format
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      expect(iso8601Regex.test(result.retrievedAt)).toBe(true);

      // Verify pageNumber and pageSize if returned
      if (result.pageNumber !== null && result.pageNumber !== undefined) {
        expect(result.pageNumber).toBe(1);
      }
      if (result.pageSize !== null && result.pageSize !== undefined) {
        expect(result.pageSize).toBe(100);
      }
    }
  });
});