import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

describe('SCEN-1150: exportWorkInstructionAndResultsToCSV - InvalidFilterConditionError for contradictory productivity rate bounds', () => {
  it('should throw InvalidFilterConditionError when minProductivityRate exceeds maxProductivityRate', async () => {
    const input = {
      minProductivityRate: 80,
      maxProductivityRate: 50,
      exportedBy: 'user-12345',
    };

    await expect(exportWorkInstructionAndResultsToCSV(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。',
      })
    );
  });
});