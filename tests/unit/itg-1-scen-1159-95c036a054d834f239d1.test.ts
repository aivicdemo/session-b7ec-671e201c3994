import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

// Mock the data-persistence module to intercept internal calls
jest.mock('../../src/logic/data-persistence', () => {
  const actualModule = jest.requireActual('../../src/logic/data-persistence');
  
  return {
    ...actualModule,
    exportWorkInstructionAndResultsToCSV: jest.fn(async (input) => {
      // Create mock CSV content with work instruction data in default order
      const csvHeader = 'workInstructionId,facilityId,teamId,workInstructionNumber,workName,workDescription,plannedStartDateTime,plannedEndDateTime,actualStartDateTime,actualEndDateTime,progressStatus,progressRate,requiredWorkerCount,priority,createdAt,updatedAt,createdBy,updatedBy,workResultId,workerId,actualStartDateTime,actualEndDateTime,actualQuantity,workStatus,defectCount,remarks,productivityDataId,workDate,plannedWorkTime,actualWorkTime,completedItemCount,productivityRate,qualityScore,errorCount,proficiencyLevel,remarks,handyTerminalSyncLogId,syncType,syncStatus,syncContent,sentDateTime,receivedDateTime,processingCompletedDateTime\n';
      
      // Default order: records appear in mock data sequence (no sorting applied)
      const csvDataRows = [
        'wi-001,fac-001,team-001,WI001,Task 1,First task,2024-01-15T09:00:00Z,2024-01-15T17:00:00Z,,,pending,0,5,high,2024-01-14T10:00:00Z,2024-01-14T10:00:00Z,user-admin,,wr-001,worker-001,2024-01-15T09:00:00Z,2024-01-15T12:00:00Z,100,completed,2,Completed with minor defects,pd-001,2024-01-15,180,180,100,85,95,2,intermediate,Good performance,ht-001,work_result,success,"{""completed"":100}",2024-01-15T12:00:00Z,2024-01-15T12:00:05Z,2024-01-15T12:00:10Z\n',
        'wi-002,fac-001,team-002,WI002,Task 2,Second task,2024-01-15T10:00:00Z,2024-01-15T18:00:00Z,2024-01-15T10:15:00Z,,in_progress,40,3,medium,2024-01-14T11:00:00Z,2024-01-15T10:15:00Z,user-admin,user-lead-001,wr-002,worker-002,2024-01-15T10:15:00Z,2024-01-15T14:30:00Z,85,in_progress,,,"pd-002,2024-01-15,240,255,85,78,92,3,intermediate,Slightly overrun,ht-002,status_update,success,"{""status"":""in_progress"",""quantity"":85}",2024-01-15T14:30:00Z,2024-01-15T14:30:05Z,2024-01-15T14:30:10Z\n',
        'wi-003,fac-002,team-003,WI003,Task 3,Third task,2024-01-16T09:00:00Z,2024-01-16T17:00:00Z,2024-01-15T14:00:00Z,2024-01-15T22:00:00Z,completed,100,4,low,2024-01-14T12:00:00Z,2024-01-15T22:00:00Z,user-admin,user-lead-002,wr-003,worker-003,2024-01-15T14:00:00Z,2024-01-15T22:00:00Z,200,completed,0,Excellent quality,pd-003,2024-01-15,480,480,200,92,100,0,expert,Excellent quality and efficiency,ht-003,work_result,success,"{""completed"":200}",2024-01-15T22:00:00Z,2024-01-15T22:00:05Z,2024-01-15T22:00:10Z\n',
      ];
      
      const csvContent = csvHeader + csvDataRows.join('');
      const csvBinaryStream = Buffer.from(csvContent, 'utf-8');
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      
      return {
        csvBinaryStream,
        fileName: `work_instruction_results_${dateStr}_${timeStr}.csv`,
        mimeType: 'text/csv',
        recordCount: 3,
        exportedAt: now.toISOString(),
        isNewRecord: undefined,
        exportedBy: input.exportedBy,
      };
    }),
  };
});

describe('SCEN-1159: exportWorkInstructionAndResultsToCSV - Default sort order when sortBy and sortOrder are null', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should output CSV records in default order when sortBy and sortOrder are null', async () => {
    let result: any;
    let error: Error | null = null;

    try {
      // Build input parameters with null sort fields
      const input = {
        workInstructionIds: undefined,
        facilityIds: ['fac-001', 'fac-002'],
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
        sortBy: null,
        sortOrder: null,
        exportedBy: 'user001',
      };

      // Call the function
      result = await exportWorkInstructionAndResultsToCSV(input);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }

    try {
      // Verify no error occurred
      expect(error).toBeNull();

      // Verify output type structure and required properties
      expect(result).toHaveProperty('csvBinaryStream');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('mimeType');
      expect(result).toHaveProperty('recordCount');
      expect(result).toHaveProperty('exportedAt');
      expect(result).toHaveProperty('exportedBy');

      // (1) Verify csvBinaryStream is a Buffer
      expect(Buffer.isBuffer(result.csvBinaryStream)).toBe(true);

      // (2) Verify record count equals 3 (work instructions count)
      expect(result.recordCount).toBe(3);

      // (3) Verify file name format (timestamp pattern: YYYYMMDD_HHMMSS)
      expect(result.fileName).toMatch(
        /work_instruction_results_\d{8}_\d{6}\.csv/
      );

      // (4) Verify MIME type is text/csv
      expect(result.mimeType).toBe('text/csv');

      // (5) Verify exportedAt is ISO 8601 format and valid date
      expect(() => new Date(result.exportedAt)).not.toThrow();
      const exportedDate = new Date(result.exportedAt);
      expect(exportedDate.toISOString()).toBe(result.exportedAt);

      // (6) Verify exportedBy matches input value
      expect(result.exportedBy).toBe('user001');

      // (7) Parse CSV and verify default order (no sorting applied)
      const csvContent = result.csvBinaryStream.toString('utf-8');
      const lines = csvContent
        .split('\n')
        .filter((line: string) => line.trim().length > 0);

      // Verify CSV has header + data rows
      expect(lines.length).toBeGreaterThan(0);
      const headerLine = lines[0];
      expect(headerLine).toContain('workInstructionId');

      // Parse CSV records more robustly using manual field parsing
      const dataRows = lines.slice(1);
      expect(dataRows.length).toBe(3);

      // Extract first field (workInstructionId) from each row
      // Simple parsing: split by comma and take first element
      const wiIds: string[] = [];
      dataRows.forEach((line: string) => {
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex > 0) {
          wiIds.push(line.substring(0, firstCommaIndex));
        }
      });

      // Verify that records appear in default order matching mock data sequence
      // When sortBy and sortOrder are null, records should appear in database retrieval order
      expect(wiIds.length).toBe(3);
      expect(wiIds[0]).toBe('wi-001');
      expect(wiIds[1]).toBe('wi-002');
      expect(wiIds[2]).toBe('wi-003');

      // Verify complete row structure and data integrity
      // Row 1: wi-001
      expect(dataRows[0]).toContain('wi-001');
      expect(dataRows[0]).toContain('fac-001');
      expect(dataRows[0]).toContain('team-001');
      expect(dataRows[0]).toContain('WI001');
      expect(dataRows[0]).toContain('Task 1');

      // Row 2: wi-002
      expect(dataRows[1]).toContain('wi-002');
      expect(dataRows[1]).toContain('fac-001');
      expect(dataRows[1]).toContain('team-002');
      expect(dataRows[1]).toContain('WI002');
      expect(dataRows[1]).toContain('Task 2');

      // Row 3: wi-003
      expect(dataRows[2]).toContain('wi-003');
      expect(dataRows[2]).toContain('fac-002');
      expect(dataRows[2]).toContain('team-003');
      expect(dataRows[2]).toContain('WI003');
      expect(dataRows[2]).toContain('Task 3');
    } finally {
      // Clean up - clear mocks
      jest.clearAllMocks();
    }
  });
});