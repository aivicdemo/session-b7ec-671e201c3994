import { exportWorkInstructionAndResultsToCSV, listWorkInstructionsByCondition, listWorkResultsByCondition, listProductivityDataByCondition, listHandyTerminalSyncLogByCondition } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1156: exportWorkInstructionAndResultsToCSV - exportedAt ISO 8601 format validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return exportedAt in ISO 8601 format within 1 minute of current UTC time', async () => {
    const mockWorkInstructions = [
      {
        workInstructionId: 'wi-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workInstructionNumber: 'WI-2024-001',
        workName: 'Assembly Task 1',
        workDescription: 'Test description 1',
        plannedStartDateTime: '2024-12-19T10:00:00Z',
        plannedEndDateTime: '2024-12-19T12:00:00Z',
        actualStartDateTime: undefined,
        actualEndDateTime: undefined,
        progressStatus: 'in_progress',
        progressRate: 50,
        requiredWorkerCount: 3,
        priority: 'high',
        createdAt: '2024-12-19T09:00:00Z',
        updatedAt: '2024-12-19T10:30:00Z',
        createdBy: 'user-admin',
        updatedBy: 'user-admin',
      },
      {
        workInstructionId: 'wi-002',
        facilityId: 'fac-001',
        teamId: 'team-002',
        workInstructionNumber: 'WI-2024-002',
        workName: 'Assembly Task 2',
        workDescription: 'Test description 2',
        plannedStartDateTime: '2024-12-19T12:00:00Z',
        plannedEndDateTime: '2024-12-19T14:00:00Z',
        actualStartDateTime: '2024-12-19T12:00:00Z',
        actualEndDateTime: '2024-12-19T14:00:00Z',
        progressStatus: 'completed',
        progressRate: 100,
        requiredWorkerCount: 2,
        priority: 'medium',
        createdAt: '2024-12-19T08:00:00Z',
        updatedAt: '2024-12-19T14:00:00Z',
        createdBy: 'user-admin',
        updatedBy: 'user-admin',
      },
    ];

    const mockWorkResults = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-12-19T10:00:00Z',
        actualEndDateTime: '2024-12-19T11:30:00Z',
        actualQuantity: 150,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Test remarks 1',
        createdAt: '2024-12-19T11:30:00Z',
        updatedAt: '2024-12-19T11:30:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'fac-001',
        teamId: 'team-002',
        actualStartDateTime: '2024-12-19T12:00:00Z',
        actualEndDateTime: '2024-12-19T14:00:00Z',
        actualQuantity: 200,
        workStatus: 'completed',
        defectCount: 0,
        remarks: undefined,
        createdAt: '2024-12-19T14:00:00Z',
        updatedAt: '2024-12-19T14:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
    ];

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: mockWorkInstructions,
      totalCount: 2,
      pageNumber: undefined,
      pageSize: undefined,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: mockWorkResults,
      totalCount: 2,
      pageNumber: undefined,
      pageSize: undefined,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      pageNumber: undefined,
      pageSize: undefined,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      pageNumber: undefined,
      pageSize: undefined,
      retrievedAt: new Date().toISOString(),
    });

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
      minProgressRate: undefined,
      maxProgressRate: undefined,
      minProductivityRate: undefined,
      maxProductivityRate: undefined,
      handyTerminalSyncStatuses: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      exportedBy: 'user-001',
    };

    const beforeCallTime = new Date();

    const result = await exportWorkInstructionAndResultsToCSV(input);

    const afterCallTime = new Date();

    expect(result).toBeDefined();
    expect(result.csvBinaryStream).toBeDefined();
    expect(result.fileName).toBeDefined();
    expect(result.mimeType).toBe('text/csv');
    expect(result.recordCount).toBeGreaterThan(0);
    expect(result.exportedAt).toBeDefined();
    expect(result.exportedBy).toBe('user-001');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.exportedAt).toMatch(iso8601Regex);

    const exportedAtTime = new Date(result.exportedAt);
    const currentUtcTime = new Date();
    const oneMinuteMs = 60 * 1000;

    const timeDifference = Math.abs(exportedAtTime.getTime() - currentUtcTime.getTime());
    expect(timeDifference).toBeLessThanOrEqual(oneMinuteMs);
  });
});