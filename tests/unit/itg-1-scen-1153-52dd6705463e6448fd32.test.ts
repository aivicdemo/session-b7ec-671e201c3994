import { exportWorkInstructionAndResultsToCSV, DataRetrievalError } from '../../src/logic/data-persistence';
import type { ExportWorkInstructionAndResultsToCSVInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1153: exportWorkInstructionAndResultsToCSV - DataRetrievalError on data fetch failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError when listWorkInstructionsByCondition fails with database connection error', async () => {
    const input: ExportWorkInstructionAndResultsToCSVInput = {
      exportedBy: 'user-001',
      workInstructionIds: ['wi-001', 'wi-002'],
      facilityIds: ['fac-001'],
      teamIds: ['team-001'],
      workerIds: undefined,
      workInstructionNumbers: ['WI-20240101-001'],
      progressStatuses: ['進行中'],
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      plannedStartToDateTime: '2024-01-31T23:59:59Z',
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      minProgressRate: 0,
      maxProgressRate: 100,
      minProductivityRate: 0.5,
      maxProductivityRate: 1.0,
      handyTerminalSyncStatuses: ['success'],
      sortBy: 'plannedStartDateTime',
      sortOrder: 'ASC',
    };

    const databaseConnectionError = new Error('Database connection timeout');

    // listWorkInstructionsByConditionをスタブ化してデータベース接続エラーをシミュレート
    const listWorkInstructionsByConditionSpy = jest
      .spyOn(dataPersistence, 'listWorkInstructionsByCondition')
      .mockRejectedValueOnce(databaseConnectionError);

    // exportWorkInstructionAndResultsToCSVを呼び出し
    let caughtError: any;
    try {
      await exportWorkInstructionAndResultsToCSV(input);
      fail('Expected DataRetrievalError to be thrown');
    } catch (error: any) {
      caughtError = error;
    }

    // listWorkInstructionsByConditionの呼び出しが試行されたことを確認
    expect(listWorkInstructionsByConditionSpy).toHaveBeenCalled();

    // DataRetrievalErrorが発生したことを確認
    expect(caughtError).toBeInstanceOf(DataRetrievalError);
    expect(caughtError.message).toBe('データベースからのデータ取得に失敗しました。');

    // 出力型のフィールドが返されない（エラーが throw されている）ことを確認
    expect(caughtError).not.toHaveProperty('csvBinaryStream');
    expect(caughtError).not.toHaveProperty('fileName');
    expect(caughtError).not.toHaveProperty('mimeType');
    expect(caughtError).not.toHaveProperty('recordCount');
    expect(caughtError).not.toHaveProperty('exportedAt');
    expect(caughtError).not.toHaveProperty('exportedBy');

    // スタックトレースまたはエラーコンテキストにlistWorkInstructionsByConditionの呼び出し失敗が含まれることを確認
    const errorContext = caughtError.cause?.message || caughtError.stack || '';
    expect(errorContext).toContain('Database connection timeout');
  });
});