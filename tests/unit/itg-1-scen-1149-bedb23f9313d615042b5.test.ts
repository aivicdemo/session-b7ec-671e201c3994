import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

describe('SCEN-1149: exportWorkInstructionAndResultsToCSV - 進捗率の下限が上限を超えている場合のエラー処理', () => {
  it('should throw InvalidFilterConditionError when minProgressRate exceeds maxProgressRate', async () => {
    const input = {
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerIds: undefined,
      workInstructionNumbers: undefined,
      progressStatuses: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minProgressRate: 75,
      maxProgressRate: 50,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      handyTerminalSyncStatuses: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      exportedBy: 'user-001'
    };

    await expect(exportWorkInstructionAndResultsToCSV(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。'
      })
    );
  });
});