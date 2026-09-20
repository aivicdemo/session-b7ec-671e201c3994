import {
  exportWorkInstructionAndResultsToCSV,
  listWorkInstructionsByCondition,
  listWorkResultsByCondition,
  listProductivityDataByCondition,
  listHandyTerminalSyncLogByCondition,
} from '../../src/logic/data-persistence';
import { ExportWorkInstructionAndResultsToCSVInput } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => {
  const actualModule = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actualModule,
    listWorkInstructionsByCondition: jest.fn(),
    listWorkResultsByCondition: jest.fn(),
    listProductivityDataByCondition: jest.fn(),
    listHandyTerminalSyncLogByCondition: jest.fn(),
  };
});

describe('SCEN-1151: exportWorkInstructionAndResultsToCSV - NoDataFoundError when no matching data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoDataFoundError when no data matches the specified conditions', async () => {
    const mockListWorkInstructions = listWorkInstructionsByCondition as jest.MockedFunction<typeof listWorkInstructionsByCondition>;
    const mockListWorkResults = listWorkResultsByCondition as jest.MockedFunction<typeof listWorkResultsByCondition>;
    const mockListProductivityData = listProductivityDataByCondition as jest.MockedFunction<typeof listProductivityDataByCondition>;
    const mockListHandyTerminalSyncLog = listHandyTerminalSyncLogByCondition as jest.MockedFunction<typeof listHandyTerminalSyncLogByCondition>;

    mockListWorkInstructions.mockResolvedValue([]);
    mockListWorkResults.mockResolvedValue([]);
    mockListProductivityData.mockResolvedValue([]);
    mockListHandyTerminalSyncLog.mockResolvedValue([]);

    const input: ExportWorkInstructionAndResultsToCSVInput = {
      workInstructionIds: ['WI-99999'],
      facilityIds: ['FAC-99999'],
      teamIds: ['TEAM-99999'],
      workerIds: ['WORKER-99999'],
      exportedBy: 'user-authenticated-001',
    };

    await expect(exportWorkInstructionAndResultsToCSV(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoDataFoundError',
        message: '指定条件に合致する作業指示・実績データが見つかりません。',
      })
    );
  });
});