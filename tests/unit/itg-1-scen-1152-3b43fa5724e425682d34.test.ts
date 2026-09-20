import {
  exportWorkInstructionAndResultsToCSV,
  ExportWorkInstructionAndResultsToCSVOutput,
  CSVGenerationError,
} from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1152: CSV形式への変換処理中にシステムエラーが発生した場合', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should raise CSVGenerationError when listWorkInstructionsByCondition throws an error', async () => {
    jest.spyOn(dataPersistence, 'listWorkInstructionsByCondition').mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const input = {
      workInstructionIds: ['WI-001'],
      facilityIds: ['FAC-001'],
      teamIds: null,
      workerIds: null,
      workInstructionNumbers: null,
      progressStatuses: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minProgressRate: null,
      maxProgressRate: null,
      minProductivityRate: null,
      maxProductivityRate: null,
      handyTerminalSyncStatuses: null,
      sortBy: null,
      sortOrder: null,
      exportedBy: 'user-123',
    };

    let thrownError: any = undefined;
    let outputReturned: ExportWorkInstructionAndResultsToCSVOutput | undefined = undefined;

    try {
      outputReturned = await exportWorkInstructionAndResultsToCSV(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(CSVGenerationError);
    expect(thrownError.message).toBe('CSV生成処理に失敗しました。システム管理者に連絡してください。');

    expect(outputReturned).toBeUndefined();
  });

  it('should raise CSVGenerationError when listWorkResultsByCondition throws an error', async () => {
    jest.spyOn(dataPersistence, 'listWorkInstructionsByCondition').mockResolvedValueOnce({
      workInstructions: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockRejectedValueOnce(
      new Error('Data fetch failed')
    );

    const input = {
      workInstructionIds: ['WI-001'],
      facilityIds: ['FAC-001'],
      teamIds: null,
      workerIds: null,
      workInstructionNumbers: null,
      progressStatuses: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minProgressRate: null,
      maxProgressRate: null,
      minProductivityRate: null,
      maxProductivityRate: null,
      handyTerminalSyncStatuses: null,
      sortBy: null,
      sortOrder: null,
      exportedBy: 'user-123',
    };

    let thrownError: any = undefined;
    let outputReturned: ExportWorkInstructionAndResultsToCSVOutput | undefined = undefined;

    try {
      outputReturned = await exportWorkInstructionAndResultsToCSV(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(CSVGenerationError);
    expect(thrownError.message).toBe('CSV生成処理に失敗しました。システム管理者に連絡してください。');

    expect(outputReturned).toBeUndefined();
  });

  it('should raise CSVGenerationError when listProductivityDataByCondition throws an error', async () => {
    jest.spyOn(dataPersistence, 'listWorkInstructionsByCondition').mockResolvedValueOnce({
      workInstructions: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValueOnce({
      workResults: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'listProductivityDataByCondition').mockRejectedValueOnce(
      new Error('Productivity data unavailable')
    );

    const input = {
      workInstructionIds: ['WI-001'],
      facilityIds: ['FAC-001'],
      teamIds: null,
      workerIds: null,
      workInstructionNumbers: null,
      progressStatuses: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minProgressRate: null,
      maxProgressRate: null,
      minProductivityRate: null,
      maxProductivityRate: null,
      handyTerminalSyncStatuses: null,
      sortBy: null,
      sortOrder: null,
      exportedBy: 'user-123',
    };

    let thrownError: any = undefined;
    let outputReturned: ExportWorkInstructionAndResultsToCSVOutput | undefined = undefined;

    try {
      outputReturned = await exportWorkInstructionAndResultsToCSV(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(CSVGenerationError);
    expect(thrownError.message).toBe('CSV生成処理に失敗しました。システム管理者に連絡してください。');

    expect(outputReturned).toBeUndefined();
  });

  it('should raise CSVGenerationError when getWorkerById throws an error', async () => {
    jest.spyOn(dataPersistence, 'listWorkInstructionsByCondition').mockResolvedValueOnce({
      workInstructions: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'listWorkResultsByCondition').mockResolvedValueOnce({
      workResults: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'listProductivityDataByCondition').mockResolvedValueOnce({
      productivityDataList: [],
      totalCount: 0,
      pageNumber: null,
      pageSize: null,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(dataPersistence, 'getWorkerById').mockRejectedValueOnce(
      new Error('Worker not found')
    );

    const input = {
      workInstructionIds: ['WI-001'],
      facilityIds: ['FAC-001'],
      teamIds: null,
      workerIds: null,
      workInstructionNumbers: null,
      progressStatuses: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      actualStartFromDateTime: null,
      actualStartToDateTime: null,
      actualEndFromDateTime: null,
      actualEndToDateTime: null,
      minProgressRate: null,
      maxProgressRate: null,
      minProductivityRate: null,
      maxProductivityRate: null,
      handyTerminalSyncStatuses: null,
      sortBy: null,
      sortOrder: null,
      exportedBy: 'user-123',
    };

    let thrownError: any = undefined;
    let outputReturned: ExportWorkInstructionAndResultsToCSVOutput | undefined = undefined;

    try {
      outputReturned = await exportWorkInstructionAndResultsToCSV(input);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(CSVGenerationError);
    expect(thrownError.message).toBe('CSV生成処理に失敗しました。システム管理者に連絡してください。');

    expect(outputReturned).toBeUndefined();
  });
});