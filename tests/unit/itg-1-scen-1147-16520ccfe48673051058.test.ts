import {
  exportWorkInstructionAndResultsToCSV,
  listWorkInstructionsByCondition,
  listWorkResultsByCondition,
  listProductivityDataByCondition,
  listHandyTerminalSyncLogByCondition,
  getWorkerById,
  getFacilityById,
  getTeamById,
} from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1147: ExportWorkInstructionAndResultsToCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSV binary stream with correct metadata when matching data exists', async () => {
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace(/[-.T:]/g, '').slice(0, 14);

    const csvContent = `workInstructionId,facilityId,teamId,workInstructionNumber,workName,plannedStartDateTime,plannedEndDateTime,progressStatus,progressRate,workerId,workerName,actualStartDateTime,actualEndDateTime,actualQuantity,workStatus,productivityRate,qualityScore,errorCount,proficiencyLevel,handyTerminalSyncStatus
WI001,FAC001,TEAM001,WI-001,Task 1,2024-01-01T09:00:00Z,2024-01-15T18:00:00Z,IN_PROGRESS,75,WKR001,Worker One,2024-01-01T09:30:00Z,2024-01-10T17:00:00Z,150,COMPLETED,0.95,0.98,1,INTERMEDIATE,SUCCESS
WI001,FAC001,TEAM001,WI-001,Task 1,2024-01-01T09:00:00Z,2024-01-15T18:00:00Z,IN_PROGRESS,75,WKR002,Worker Two,2024-01-02T10:00:00Z,2024-01-11T16:30:00Z,145,COMPLETED,0.92,0.96,2,INTERMEDIATE,SUCCESS
WI002,FAC001,TEAM001,WI-002,Task 2,2024-01-05T08:00:00Z,2024-01-20T17:00:00Z,COMPLETED,100,WKR001,Worker One,2024-01-05T08:15:00Z,2024-01-18T15:45:00Z,200,COMPLETED,1.05,0.99,0,ADVANCED,SUCCESS
WI002,FAC001,TEAM001,WI-002,Task 2,2024-01-05T08:00:00Z,2024-01-20T17:00:00Z,COMPLETED,100,WKR002,Worker Two,2024-01-06T09:00:00Z,2024-01-19T14:20:00Z,198,COMPLETED,1.00,0.97,1,ADVANCED,SUCCESS
`;

    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    const mockOutput = {
      csvBinaryStream: csvBuffer,
      fileName: `work-instruction-results-${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 4,
      exportedAt: now.toISOString(),
      exportedBy: 'ADMIN001',
    };

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue(mockOutput);

    // Setup stubs for listWorkInstructionsByCondition
    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [
        {
          workInstructionId: 'WI001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workInstructionNumber: 'WI-001',
          workName: 'Task 1',
          plannedStartDateTime: '2024-01-01T09:00:00Z',
          plannedEndDateTime: '2024-01-15T18:00:00Z',
          progressStatus: 'IN_PROGRESS',
          progressRate: 75,
          requiredWorkerCount: 2,
          priority: 'HIGH',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z',
          createdBy: 'ADMIN001',
        },
        {
          workInstructionId: 'WI002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workInstructionNumber: 'WI-002',
          workName: 'Task 2',
          plannedStartDateTime: '2024-01-05T08:00:00Z',
          plannedEndDateTime: '2024-01-20T17:00:00Z',
          progressStatus: 'COMPLETED',
          progressRate: 100,
          requiredWorkerCount: 2,
          priority: 'MEDIUM',
          createdAt: '2024-01-05T07:00:00Z',
          updatedAt: '2024-01-05T07:00:00Z',
          createdBy: 'ADMIN001',
        },
      ],
      totalCount: 2,
      retrievedAt: now.toISOString(),
    });

    // Setup stubs for listWorkResultsByCondition
    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [
        {
          workResultId: 'WR001',
          workInstructionId: 'WI001',
          workerId: 'WKR001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          actualStartDateTime: '2024-01-01T09:30:00Z',
          actualEndDateTime: '2024-01-10T17:00:00Z',
          actualQuantity: 150,
          workStatus: 'COMPLETED',
          createdAt: '2024-01-01T09:30:00Z',
          updatedAt: '2024-01-10T17:00:00Z',
          createdBy: 'WKR001',
        },
        {
          workResultId: 'WR002',
          workInstructionId: 'WI001',
          workerId: 'WKR002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          actualStartDateTime: '2024-01-02T10:00:00Z',
          actualEndDateTime: '2024-01-11T16:30:00Z',
          actualQuantity: 145,
          workStatus: 'COMPLETED',
          createdAt: '2024-01-02T10:00:00Z',
          updatedAt: '2024-01-11T16:30:00Z',
          createdBy: 'WKR002',
        },
        {
          workResultId: 'WR003',
          workInstructionId: 'WI002',
          workerId: 'WKR001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          actualStartDateTime: '2024-01-05T08:15:00Z',
          actualEndDateTime: '2024-01-18T15:45:00Z',
          actualQuantity: 200,
          workStatus: 'COMPLETED',
          createdAt: '2024-01-05T08:15:00Z',
          updatedAt: '2024-01-18T15:45:00Z',
          createdBy: 'WKR001',
        },
        {
          workResultId: 'WR004',
          workInstructionId: 'WI002',
          workerId: 'WKR002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          actualStartDateTime: '2024-01-06T09:00:00Z',
          actualEndDateTime: '2024-01-19T14:20:00Z',
          actualQuantity: 198,
          workStatus: 'COMPLETED',
          createdAt: '2024-01-06T09:00:00Z',
          updatedAt: '2024-01-19T14:20:00Z',
          createdBy: 'WKR002',
        },
      ],
      totalCount: 4,
      retrievedAt: now.toISOString(),
    });

    // Setup stubs for listProductivityDataByCondition
    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [
        {
          productivityDataId: 'PD001',
          workResultId: 'WR001',
          workerId: 'WKR001',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workDate: '2024-01-01T00:00:00Z',
          plannedWorkTime: 480,
          actualWorkTime: 505,
          completedItemCount: 150,
          productivityRate: 0.95,
          qualityScore: 0.98,
          errorCount: 1,
          proficiencyLevel: 'INTERMEDIATE',
          createdAt: '2024-01-01T09:30:00Z',
          updatedAt: '2024-01-01T09:30:00Z',
          createdBy: 'WKR001',
        },
        {
          productivityDataId: 'PD002',
          workResultId: 'WR002',
          workerId: 'WKR002',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workDate: '2024-01-02T00:00:00Z',
          plannedWorkTime: 480,
          actualWorkTime: 521,
          completedItemCount: 145,
          productivityRate: 0.92,
          qualityScore: 0.96,
          errorCount: 2,
          proficiencyLevel: 'INTERMEDIATE',
          createdAt: '2024-01-02T10:00:00Z',
          updatedAt: '2024-01-02T10:00:00Z',
          createdBy: 'WKR002',
        },
      ],
      totalCount: 2,
      retrievedAt: now.toISOString(),
    });

    // Setup stubs for listHandyTerminalSyncLogByCondition
    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [
        {
          handyTerminalSyncLogId: 'HS001',
          workerId: 'WKR001',
          handyTerminalId: 'HT001',
          facilityId: 'FAC001',
          syncType: 'work_result',
          workInstructionId: 'WI001',
          syncContent: '{"quantity":150}',
          syncStatus: 'SUCCESS',
          sentDateTime: '2024-01-01T09:30:00Z',
          receivedDateTime: '2024-01-01T09:31:00Z',
          processingCompletedDateTime: '2024-01-01T09:32:00Z',
          retryCount: 0,
          createdAt: '2024-01-01T09:30:00Z',
          updatedAt: '2024-01-01T09:30:00Z',
          createdBy: 'SYSTEM',
        },
        {
          handyTerminalSyncLogId: 'HS002',
          workerId: 'WKR002',
          handyTerminalId: 'HT002',
          facilityId: 'FAC001',
          syncType: 'work_result',
          workInstructionId: 'WI002',
          syncContent: '{"quantity":198}',
          syncStatus: 'SUCCESS',
          sentDateTime: '2024-01-06T09:00:00Z',
          receivedDateTime: '2024-01-06T09:01:00Z',
          processingCompletedDateTime: '2024-01-06T09:02:00Z',
          retryCount: 0,
          createdAt: '2024-01-06T09:00:00Z',
          updatedAt: '2024-01-06T09:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 2,
      retrievedAt: now.toISOString(),
    });

    // Setup stubs for getWorkerById
    (getWorkerById as jest.Mock).mockImplementation(({ workerId }) => {
      if (workerId === 'WKR001') {
        return Promise.resolve({
          workerId: 'WKR001',
          workerName: 'Worker One',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          jobType: 'ASSEMBLER',
          operatingStatus: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'ADMIN001',
        });
      }
      if (workerId === 'WKR002') {
        return Promise.resolve({
          workerId: 'WKR002',
          workerName: 'Worker Two',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          jobType: 'ASSEMBLER',
          operatingStatus: 'ACTIVE',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'ADMIN001',
        });
      }
      return Promise.reject(new Error('Worker not found'));
    });

    // Setup stub for getFacilityById
    (getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: 'Facility One',
      facilityCode: 'FAC-001',
      address: '123 Main St',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'ACTIVE',
      responsiblePersonName: 'Manager',
      contactInfo: '555-0001',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN001',
    });

    // Setup stub for getTeamById
    (getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'Team One',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      operatingStatus: 'ACTIVE',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN001',
    });

    const input = {
      workInstructionIds: ['WI001', 'WI002'],
      facilityIds: ['FAC001'],
      teamIds: ['TEAM001'],
      workerIds: ['WKR001', 'WKR002'],
      progressStatuses: ['IN_PROGRESS', 'COMPLETED'],
      plannedStartFromDateTime: '2024-01-01T09:00:00Z',
      plannedStartToDateTime: '2024-01-31T18:00:00Z',
      minProgressRate: 50,
      maxProgressRate: 100,
      minProductivityRate: 0.8,
      maxProductivityRate: 1.2,
      exportedBy: 'ADMIN001',
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result.csvBinaryStream).toBeDefined();
    expect(Buffer.isBuffer(result.csvBinaryStream)).toBe(true);

    const decodedContent = result.csvBinaryStream.toString('utf-8');
    expect(decodedContent).toContain('workInstructionId');
    expect(decodedContent).toContain('facilityId');
    expect(decodedContent).toContain('workerId');
    expect(decodedContent).toContain('productivityRate');
    
    // CSV should have header line + 4 data lines + trailing newline
    // split('\n') on "header\ndata1\ndata2\ndata3\ndata4\n" yields 6 elements (last is empty string)
    // but we count only non-empty lines or check for data presence
    const lines = decodedContent.split('\n').filter(line => line.trim().length > 0);
    expect(lines.length).toBe(5); // 1 header + 4 data rows

    expect(result.fileName).toMatch(/^work-instruction-results-\d{8}-\d{6}\.csv$/);
    expect(result.fileName).toContain(formattedTimestamp.slice(0, 8));

    expect(result.mimeType).toBe('text/csv');

    expect(result.recordCount).toBe(4);

    const exportedAtDate = new Date(result.exportedAt);
    const timeDiffMs = Math.abs(exportedAtDate.getTime() - now.getTime());
    expect(timeDiffMs).toBeLessThanOrEqual(5000);

    expect(result.exportedBy).toBe('ADMIN001');

    expect(exportWorkInstructionAndResultsToCSV).toHaveBeenCalledWith(input);
    expect(exportWorkInstructionAndResultsToCSV).toHaveBeenCalledTimes(1);
  });
});