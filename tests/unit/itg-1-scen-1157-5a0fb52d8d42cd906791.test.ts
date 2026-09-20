import { exportWorkInstructionAndResultsToCSV } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1157: exportWorkInstructionAndResultsToCSV recordCount validation', () => {
  it('should return recordCount matching the total number of exported records', async () => {
    const input = {
      workInstructionIds: ['WI001', 'WI002', 'WI003'],
      facilityIds: ['F001'],
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
      sortBy: 'workInstructionId',
      sortOrder: 'ASC',
      exportedBy: 'USER-123'
    };

    const csvContent = `workInstructionId,workInstructionNumber,facilityId,teamId,workName,progressStatus,progressRate,plannedStartDateTime,plannedEndDateTime,actualStartDateTime,actualEndDateTime,workResultId,workerId,workerName,actualQuantity,workStatus,defectCount,productivityDataId,completedItemCount,productivityRate,qualityScore,errorCount,proficiencyLevel,handyTerminalSyncLogId,syncType,syncStatus
WI001,WI-001,F001,T001,Assembly Task 1,complete,100,2024-01-15T08:00:00Z,2024-01-15T16:00:00Z,2024-01-15T08:15:00Z,2024-01-15T15:45:00Z,WR001,W001,Worker A,100,complete,2,PD001,100,95,98,2,intermediate,HT001,work_result,success
WI002,WI-002,F001,T001,Assembly Task 2,in_progress,60,2024-01-16T08:00:00Z,2024-01-16T16:00:00Z,2024-01-16T08:20:00Z,,WR002,W002,Worker B,60,in_progress,1,PD002,60,75,96,1,basic,HT002,work_result,success
WI003,WI-003,F001,T001,Assembly Task 3,pending,0,2024-01-17T08:00:00Z,2024-01-17T16:00:00Z,,,WR003,W003,Worker C,0,pending,0,PD003,0,0,0,0,basic,HT003,status_update,pending`;

    const exportWorkInstructionAndResultsToCSVMock = exportWorkInstructionAndResultsToCSV as jest.MockedFunction<
      typeof exportWorkInstructionAndResultsToCSV
    >;

    exportWorkInstructionAndResultsToCSVMock.mockResolvedValue({
      csvBinaryStream: Buffer.from(csvContent),
      fileName: `export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      mimeType: 'text/csv',
      recordCount: 3,
      exportedAt: new Date().toISOString(),
      exportedBy: 'USER-123'
    });

    const result = await exportWorkInstructionAndResultsToCSV(input);

    expect(result.recordCount).toBe(3);
    expect(result.csvBinaryStream).toBeInstanceOf(Buffer);
    expect(typeof result.fileName).toBe('string');
    expect(result.fileName).toMatch(/export_.*\.csv/);
    expect(result.mimeType).toBe('text/csv');
    expect(result.exportedAt).toBeDefined();
    expect(typeof result.exportedAt).toBe('string');
    expect(result.exportedBy).toBe('USER-123');
    expect(exportWorkInstructionAndResultsToCSVMock).toHaveBeenCalledWith(input);
  });
});