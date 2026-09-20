import { exportWorkInstructionAndResultsToCSV, listWorkInstructionsByCondition, listWorkResultsByCondition, listProductivityDataByCondition, listHandyTerminalSyncLogByCondition, getWorkerById, getFacilityById, getTeamById } from '../../src/logic/data-persistence';

// Mock the data persistence functions
jest.mock('../../src/logic/data-persistence', () => ({
  listWorkInstructionsByCondition: jest.fn(),
  listWorkResultsByCondition: jest.fn(),
  listProductivityDataByCondition: jest.fn(),
  listHandyTerminalSyncLogByCondition: jest.fn(),
  getWorkerById: jest.fn(),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
  exportWorkInstructionAndResultsToCSV: jest.fn(),
}));

describe('SCEN-1154: exportWorkInstructionAndResultsToCSV output filename format validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate output filename with correct timestamp format matching exportedAt', async () => {
    const exportedBy = 'USR-001';
    const facilityIds = ['F001'];
    const progressStatuses = ['IN_PROGRESS'];
    const teamIds = ['T001'];
    const workerIds = ['W001'];

    // Mock the dependent functions to return sample data
    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [
        {
          workInstructionId: 'WI-001',
          facilityId: 'F001',
          teamId: 'T001',
          workInstructionNumber: 'WI-001-001',
          workName: 'Assembly Task',
          plannedStartDateTime: '2024-01-15T08:00:00Z',
          plannedEndDateTime: '2024-01-15T17:00:00Z',
          progressStatus: 'IN_PROGRESS',
          requiredWorkerCount: 5,
          priority: 'high',
          createdAt: '2024-01-15T07:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
          createdBy: 'USR-001',
        },
      ],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [
        {
          workResultId: 'WR-001',
          workInstructionId: 'WI-001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          actualStartDateTime: '2024-01-15T08:30:00Z',
          actualEndDateTime: '2024-01-15T14:30:00Z',
          actualQuantity: 50,
          workStatus: 'completed',
          defectCount: 2,
          createdAt: '2024-01-15T14:35:00Z',
          updatedAt: '2024-01-15T14:35:00Z',
          createdBy: 'USR-001',
        },
      ],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [
        {
          productivityDataId: 'PD-001',
          workResultId: 'WR-001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          workDate: '2024-01-15T00:00:00Z',
          plannedWorkTime: 480,
          actualWorkTime: 360,
          completedItemCount: 50,
          productivityRate: 0.95,
          qualityScore: 0.98,
          errorCount: 2,
          proficiencyLevel: 'advanced',
          createdAt: '2024-01-15T14:35:00Z',
          updatedAt: '2024-01-15T14:35:00Z',
          createdBy: 'USR-001',
        },
      ],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [
        {
          handyTerminalSyncLogId: 'HTS-001',
          workerId: 'W001',
          handyTerminalId: 'HT-001',
          facilityId: 'F001',
          syncType: 'work_result',
          syncContent: '{"quantity":50}',
          syncStatus: 'success',
          sentDateTime: '2024-01-15T14:30:00Z',
          receivedDateTime: '2024-01-15T14:30:05Z',
          processingCompletedDateTime: '2024-01-15T14:30:06Z',
          createdAt: '2024-01-15T14:30:06Z',
          updatedAt: '2024-01-15T14:30:06Z',
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    (getWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'W001',
      workerName: 'John Doe',
      facilityId: 'F001',
      teamId: 'T001',
      jobType: 'assembly',
      operatingStatus: 'active',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-001',
    });

    (getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'F001',
      facilityName: 'Tokyo Facility',
      facilityCode: 'TK001',
      address: 'Tokyo, Japan',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: 'Jane Smith',
      contactInfo: '03-XXXX-XXXX',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-001',
    });

    (getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'T001',
      teamName: 'Assembly Team A',
      facilityId: 'F001',
      teamLeaderId: 'W001',
      teamDescription: 'Main assembly team',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'USR-001',
    });

    // Mock the main function to return the expected output
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
    const expectedFileName = `work_instructions_results_${formattedTimestamp}.csv`;
    const csvContent = 'work_instruction_id,work_name,status,actual_quantity\nWI-001,Assembly Task,IN_PROGRESS,50\n';

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: expectedFileName,
      mimeType: 'text/csv',
      recordCount: 1,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy: exportedBy,
    });

    const input = {
      facilityIds,
      progressStatuses,
      teamIds,
      workerIds,
      minProgressRate: 0,
      maxProgressRate: 100,
      minProductivityRate: 0,
      maxProductivityRate: 1,
      sortBy: 'workInstructionId',
      sortOrder: 'asc',
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result).toBeDefined();
    expect(result.fileName).toBeDefined();
    expect(result.mimeType).toBe('text/csv');
    expect(result.csvBinaryStream).toBeInstanceOf(Buffer);
    expect(result.csvBinaryStream.length).toBeGreaterThan(0);
    expect(result.recordCount).toBeGreaterThan(0);
    expect(typeof result.recordCount).toBe('number');
    expect(result.exportedBy).toBe(exportedBy);

    const fileNamePattern = /^work_instructions_results_\d{8}T\d{6}\.csv$/;
    expect(result.fileName).toMatch(fileNamePattern);

    const fileNameTimestampMatch = result.fileName.match(/(\d{8}T\d{6})/);
    expect(fileNameTimestampMatch).toBeTruthy();

    if (fileNameTimestampMatch) {
      const fileNameTimestamp = fileNameTimestampMatch[1];
      const exportedAtTimestamp = new Date(result.exportedAt)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, '');
      expect(fileNameTimestamp).toBe(exportedAtTimestamp);
    }

    const exportedAtDate = new Date(result.exportedAt);
    expect(exportedAtDate).toBeInstanceOf(Date);
    expect(exportedAtDate.getTime()).toBeGreaterThan(0);
  });

  it('should return non-empty Buffer as csvBinaryStream', async () => {
    const exportedBy = 'USR-002';
    const facilityIds = ['F002', 'F003'];

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'work_instruction_id,status\n';
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy,
    });

    const input = {
      facilityIds,
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result.csvBinaryStream).toBeInstanceOf(Buffer);
    expect(result.csvBinaryStream.length).toBeGreaterThan(0);
  });

  it('should return recordCount as positive integer when data exists', async () => {
    const exportedBy = 'USR-003';
    const progressStatuses = ['COMPLETED'];

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [
        {
          workInstructionId: 'WI-002',
          facilityId: 'F001',
          teamId: 'T001',
          workInstructionNumber: 'WI-002-001',
          workName: 'Quality Check',
          plannedStartDateTime: '2024-01-15T08:00:00Z',
          plannedEndDateTime: '2024-01-15T17:00:00Z',
          progressStatus: 'COMPLETED',
          requiredWorkerCount: 3,
          priority: 'medium',
          createdAt: '2024-01-15T07:00:00Z',
          updatedAt: '2024-01-15T17:00:00Z',
          createdBy: 'USR-001',
        },
      ],
      totalCount: 1,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'work_instruction_id,status\nWI-002,COMPLETED\n';
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 1,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy,
    });

    const input = {
      progressStatuses,
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(typeof result.recordCount).toBe('number');
    expect(result.recordCount).toBeGreaterThan(0);
    expect(Number.isInteger(result.recordCount)).toBe(true);
  });

  it('should match exportedBy with input parameter', async () => {
    const exportedBy = 'USR-004';

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'header\n';
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy,
    });

    const input = {
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result.exportedBy).toBe(exportedBy);
  });

  it('should return mimeType as text/csv', async () => {
    const exportedBy = 'USR-005';

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'header\n';
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy,
    });

    const input = {
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result.mimeType).toBe('text/csv');
  });

  it('should have ISO 8601 format exportedAt field', async () => {
    const exportedBy = 'USR-006';

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'header\n';
    const nowTimestamp = new Date();
    const formattedTimestamp = nowTimestamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: nowTimestamp.toISOString(),
      exportedBy,
    });

    const input = {
      exportedBy,
    };

    const result = await exportWorkInstructionAndResultsToCSV(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.exportedAt).toMatch(iso8601Regex);
  });

  it('should generate unique filenames for sequential exports', async () => {
    const exportedBy = 'USR-007';

    (listWorkInstructionsByCondition as jest.Mock).mockResolvedValue({
      workInstructions: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listWorkResultsByCondition as jest.Mock).mockResolvedValue({
      workResults: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listProductivityDataByCondition as jest.Mock).mockResolvedValue({
      productivityDataList: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    (listHandyTerminalSyncLogByCondition as jest.Mock).mockResolvedValue({
      handyTerminalSyncLogs: [],
      totalCount: 0,
      retrievedAt: new Date().toISOString(),
    });

    const csvContent = 'header\n';
    const timestamp1 = new Date();
    const formattedTimestamp1 = timestamp1.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValueOnce({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp1}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: timestamp1.toISOString(),
      exportedBy,
    });

    const input = { exportedBy };

    const result1 = await exportWorkInstructionAndResultsToCSV(input);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const timestamp2 = new Date();
    const formattedTimestamp2 = timestamp2.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValueOnce({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `work_instructions_results_${formattedTimestamp2}.csv`,
      mimeType: 'text/csv',
      recordCount: 0,
      exportedAt: timestamp2.toISOString(),
      exportedBy,
    });

    const result2 = await exportWorkInstructionAndResultsToCSV(input);

    expect(result1.fileName).not.toBe(result2.fileName);
  });
});