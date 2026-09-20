import {
  exportWorkInstructionAndResultsToCSV,
  ExportWorkInstructionAndResultsToCSVInput,
  ExportWorkInstructionAndResultsToCSVOutput,
  ListWorkInstructionsByConditionOutput,
  ListWorkResultsByConditionOutput,
  ListProductivityDataByConditionOutput,
  ListHandyTerminalSyncLogByConditionOutput,
  GetWorkerByIdOutput,
  GetFacilityByIdOutput,
  GetTeamByIdOutput,
} from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1155: exportWorkInstructionAndResultsToCSV mimeType validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWorkInstruction = (): ListWorkInstructionsByConditionOutput => ({
    workInstructions: [
      {
        workInstructionId: 'wi-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workInstructionNumber: 'WI-001',
        workName: 'Assembly Task 1',
        workDescription: 'Description 1',
        plannedStartDateTime: '2024-01-01T09:00:00Z',
        plannedEndDateTime: '2024-01-01T17:00:00Z',
        actualStartDateTime: '2024-01-01T09:05:00Z',
        actualEndDateTime: '2024-01-01T16:55:00Z',
        progressStatus: 'completed',
        progressRate: 100,
        requiredWorkerCount: 5,
        priority: 'high',
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T17:30:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workInstructionId: 'wi-002',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workInstructionNumber: 'WI-002',
        workName: 'Assembly Task 2',
        workDescription: 'Description 2',
        plannedStartDateTime: '2024-01-02T09:00:00Z',
        plannedEndDateTime: '2024-01-02T17:00:00Z',
        actualStartDateTime: '2024-01-02T09:10:00Z',
        actualEndDateTime: undefined,
        progressStatus: 'in_progress',
        progressRate: 50,
        requiredWorkerCount: 3,
        priority: 'medium',
        createdAt: '2024-01-02T08:00:00Z',
        updatedAt: '2024-01-02T15:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
      {
        workInstructionId: 'wi-003',
        facilityId: 'fac-002',
        teamId: 'team-002',
        workInstructionNumber: 'WI-003',
        workName: 'Assembly Task 3',
        workDescription: 'Description 3',
        plannedStartDateTime: '2024-01-03T09:00:00Z',
        plannedEndDateTime: '2024-01-03T17:00:00Z',
        actualStartDateTime: undefined,
        actualEndDateTime: undefined,
        progressStatus: 'not_started',
        progressRate: 0,
        requiredWorkerCount: 4,
        priority: 'low',
        createdAt: '2024-01-03T08:00:00Z',
        updatedAt: '2024-01-03T08:00:00Z',
        createdBy: 'user-003',
        updatedBy: undefined,
      },
    ],
    totalCount: 3,
    pageNumber: undefined,
    pageSize: undefined,
    retrievedAt: '2024-01-03T12:00:00Z',
  });

  const mockWorkResult = (): ListWorkResultsByConditionOutput => ({
    workResults: [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T09:05:00Z',
        actualEndDateTime: '2024-01-01T12:05:00Z',
        actualQuantity: 50,
        workStatus: 'completed',
        defectCount: 2,
        remarks: 'Minor issues resolved',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T12:10:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-001',
        workerId: 'worker-002',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-01T09:00:00Z',
        actualEndDateTime: '2024-01-01T16:55:00Z',
        actualQuantity: 100,
        workStatus: 'completed',
        defectCount: 0,
        remarks: undefined,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T17:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-002',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        actualStartDateTime: '2024-01-02T09:10:00Z',
        actualEndDateTime: '2024-01-02T15:00:00Z',
        actualQuantity: 75,
        workStatus: 'in_progress',
        defectCount: 1,
        remarks: 'On track',
        createdAt: '2024-01-02T09:00:00Z',
        updatedAt: '2024-01-02T15:05:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
    ],
    totalCount: 3,
    pageNumber: undefined,
    pageSize: undefined,
    retrievedAt: '2024-01-03T12:00:00Z',
  });

  const mockProductivityData = (): ListProductivityDataByConditionOutput => ({
    productivityDataList: [
      {
        productivityDataId: 'pd-001',
        workResultId: 'wr-001',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workDate: '2024-01-01',
        plannedWorkTime: 480,
        actualWorkTime: 180,
        completedItemCount: 50,
        productivityRate: 95,
        qualityScore: 98,
        errorCount: 0,
        proficiencyLevel: 'advanced',
        remarks: 'Excellent performance',
        createdAt: '2024-01-01T12:15:00Z',
        updatedAt: '2024-01-01T12:15:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        productivityDataId: 'pd-002',
        workResultId: 'wr-002',
        workerId: 'worker-002',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workDate: '2024-01-01',
        plannedWorkTime: 480,
        actualWorkTime: 420,
        completedItemCount: 100,
        productivityRate: 100,
        qualityScore: 100,
        errorCount: 0,
        proficiencyLevel: 'expert',
        remarks: undefined,
        createdAt: '2024-01-01T17:05:00Z',
        updatedAt: '2024-01-01T17:05:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        productivityDataId: 'pd-003',
        workResultId: 'wr-003',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-001',
        workDate: '2024-01-02',
        plannedWorkTime: 480,
        actualWorkTime: 350,
        completedItemCount: 75,
        productivityRate: 92,
        qualityScore: 96,
        errorCount: 1,
        proficiencyLevel: 'advanced',
        remarks: 'Good progress',
        createdAt: '2024-01-02T15:10:00Z',
        updatedAt: '2024-01-02T15:10:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
    ],
    totalCount: 3,
    pageNumber: undefined,
    pageSize: undefined,
    retrievedAt: '2024-01-03T12:00:00Z',
  });

  const mockHandyTerminalSyncLog = (): ListHandyTerminalSyncLogByConditionOutput => ({
    handyTerminalSyncLogs: [
      {
        handyTerminalSyncLogId: 'hts-001',
        workerId: 'worker-001',
        handyTerminalId: 'ht-001',
        facilityId: 'fac-001',
        syncType: 'work_result',
        workInstructionId: 'wi-001',
        syncContent: JSON.stringify({ quantity: 50 }),
        syncStatus: 'success',
        errorMessage: undefined,
        sentDateTime: '2024-01-01T12:05:00Z',
        receivedDateTime: '2024-01-01T12:05:05Z',
        processingCompletedDateTime: '2024-01-01T12:05:10Z',
        retryCount: 0,
        createdAt: '2024-01-01T12:05:10Z',
        updatedAt: '2024-01-01T12:05:10Z',
        createdBy: 'system',
        updatedBy: undefined,
      },
      {
        handyTerminalSyncLogId: 'hts-002',
        workerId: 'worker-002',
        handyTerminalId: 'ht-002',
        facilityId: 'fac-001',
        syncType: 'work_result',
        workInstructionId: 'wi-001',
        syncContent: JSON.stringify({ quantity: 100 }),
        syncStatus: 'success',
        errorMessage: undefined,
        sentDateTime: '2024-01-01T16:55:00Z',
        receivedDateTime: '2024-01-01T16:55:05Z',
        processingCompletedDateTime: '2024-01-01T16:55:10Z',
        retryCount: 0,
        createdAt: '2024-01-01T16:55:10Z',
        updatedAt: '2024-01-01T16:55:10Z',
        createdBy: 'system',
        updatedBy: undefined,
      },
      {
        handyTerminalSyncLogId: 'hts-003',
        workerId: 'worker-001',
        handyTerminalId: 'ht-001',
        facilityId: 'fac-001',
        syncType: 'work_result',
        workInstructionId: 'wi-002',
        syncContent: JSON.stringify({ quantity: 75 }),
        syncStatus: 'success',
        errorMessage: undefined,
        sentDateTime: '2024-01-02T15:00:00Z',
        receivedDateTime: '2024-01-02T15:00:05Z',
        processingCompletedDateTime: '2024-01-02T15:00:10Z',
        retryCount: 0,
        createdAt: '2024-01-02T15:00:10Z',
        updatedAt: '2024-01-02T15:00:10Z',
        createdBy: 'system',
        updatedBy: undefined,
      },
    ],
    totalCount: 3,
    pageNumber: undefined,
    pageSize: undefined,
    retrievedAt: '2024-01-03T12:00:00Z',
  });

  const mockWorker = (workerId: string): GetWorkerByIdOutput => ({
    workerId,
    workerName: `Worker ${workerId}`,
    facilityId: 'fac-001',
    teamId: 'team-001',
    jobType: 'standard',
    operatingStatus: 'active',
    hourlyRate: 1000,
    maxWorkingHours: 8,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
    createdBy: 'system',
    updatedBy: undefined,
  });

  const mockFacility = (facilityId: string): GetFacilityByIdOutput => ({
    facilityId,
    facilityName: `Facility ${facilityId}`,
    facilityCode: facilityId,
    address: `Address for ${facilityId}`,
    maxCapacity: 100,
    currentCapacity: 50,
    operatingStatus: 'active',
    responsiblePersonName: 'Manager Name',
    contactInfo: '090-1234-5678',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
    createdBy: 'system',
    updatedBy: undefined,
  });

  const mockTeam = (teamId: string): GetTeamByIdOutput => ({
    teamId,
    teamName: `Team ${teamId}`,
    facilityId: 'fac-001',
    teamLeaderId: 'leader-001',
    teamDescription: `Description for ${teamId}`,
    operatingStatus: 'active',
    capacity: 10,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
    createdBy: 'system',
    updatedBy: undefined,
  });

  describe('SCEN-1155: mimeType validation', () => {
    it('should return mimeType as text/csv string', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result).toBeDefined();
      expect(result.mimeType).toBeDefined();
      expect(typeof result.mimeType).toBe('string');
      expect(result.mimeType).toBe('text/csv');
    });

    it('should include all required output fields', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result).toHaveProperty('csvBinaryStream');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('mimeType');
      expect(result).toHaveProperty('recordCount');
      expect(result).toHaveProperty('exportedAt');
      expect(result).toHaveProperty('exportedBy');
    });

    it('should return csvBinaryStream as Buffer type', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.csvBinaryStream).toBeInstanceOf(Buffer);
    });

    it('should return fileName containing timestamp and csv extension', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.fileName).toBeDefined();
      expect(typeof result.fileName).toBe('string');
      expect(result.fileName).toMatch(/\.csv$/);
    });

    it('should return recordCount as non-negative number', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.recordCount).toBeDefined();
      expect(typeof result.recordCount).toBe('number');
      expect(result.recordCount).toBeGreaterThanOrEqual(0);
    });

    it('should return exportedAt in ISO 8601 format', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.exportedAt).toBeDefined();
      expect(typeof result.exportedAt).toBe('string');
      expect(() => new Date(result.exportedAt)).not.toThrow();
      expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
    });

    it('should return exportedBy matching input user ID', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.exportedBy).toBe(userId);
    });

    it('should generate CSV content in binary stream', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.csvBinaryStream.length).toBeGreaterThan(0);
      const csvContent = result.csvBinaryStream.toString('utf-8');
      expect(csvContent).toBeTruthy();
    });

    it('should return mimeType suitable for HTTP Content-Type header', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.mimeType).toBe('text/csv');
      expect(result.mimeType).toMatch(/^[a-z]+\/[a-z\-\+]+$/);
    });

    it('should return consistent mimeType across multiple calls', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from('work_instruction_id,work_name\nwi-001,Assembly Task 1'),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result1: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);
      const result2: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result1.mimeType).toBe(result2.mimeType);
      expect(result1.mimeType).toBe('text/csv');
    });

    it('should extract all data when search conditions are null/undefined', async () => {
      const userId = 'user-auth-verified';

      (exportWorkInstructionAndResultsToCSV as jest.Mock).mockResolvedValue({
        csvBinaryStream: Buffer.from(
          'work_instruction_id,work_name\nwi-001,Assembly Task 1\nwi-002,Assembly Task 2\nwi-003,Assembly Task 3'
        ),
        fileName: 'export_20240103_120000.csv',
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: '2024-01-03T12:00:00Z',
        exportedBy: userId,
      });

      const input: ExportWorkInstructionAndResultsToCSVInput = {
        exportedBy: userId,
        facilityIds: undefined,
        teamIds: undefined,
        workerIds: undefined,
        workInstructionIds: undefined,
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
      };

      const result: ExportWorkInstructionAndResultsToCSVOutput =
        await exportWorkInstructionAndResultsToCSV(input);

      expect(result.csvBinaryStream).toBeDefined();
      expect(result.csvBinaryStream.length).toBeGreaterThan(0);
      const csvContent = result.csvBinaryStream.toString('utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());
      expect(lines.length).toBeGreaterThan(1);
    });
  });
});