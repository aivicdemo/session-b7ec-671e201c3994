import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

describe('SCEN-1148: exportWorkInstructionAndResultsToCSV - 日付範囲矛盾エラー検証', () => {
  it('検索条件の日付範囲に矛盾がある場合、InvalidFilterConditionErrorを発生させる', async () => {
    // Arrange
    const input = {
      plannedStartFromDateTime: '2024-01-15T10:00:00Z',
      plannedStartToDateTime: '2024-01-10T15:00:00Z',
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workerIds: undefined,
      workInstructionNumbers: undefined,
      progressStatuses: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      handyTerminalSyncStatuses: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      exportedBy: 'user-001'
    };

    // Act & Assert
    await expect(exportWorkInstructionAndResultsToCSV(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidFilterConditionError',
        message: '検索条件が無効です。拠点ID・チームID・作業指示ID・作業者ID・日付範囲を確認してください。'
      })
    );
  });
});