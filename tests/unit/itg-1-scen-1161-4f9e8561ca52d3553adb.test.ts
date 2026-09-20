import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  exportWorkInstructionAndResultsToCSV,
  listWorkInstructionsByCondition,
  listWorkResultsByCondition,
  listProductivityDataByCondition,
  listHandyTerminalSyncLogByCondition,
} from '../../src/logic/data-persistence';
import {
  ExportWorkInstructionAndResultsToCSVInput,
  ExportWorkInstructionAndResultsToCSVOutput,
  GetWorkInstructionByIdOutput,
  GetWorkResultByIdOutput,
  GetProductivityDataByIdOutput,
  GetHandyTerminalSyncLogByIdOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-1161: 複数検索条件が同時に指定された場合、全条件のAND結合で該当データが抽出される', () => {
  let mockWorkInstructions: GetWorkInstructionByIdOutput[];
  let mockWorkResults: GetWorkResultByIdOutput[];
  let mockProductivityData: GetProductivityDataByIdOutput[];
  let mockHandyTerminalLogs: GetHandyTerminalSyncLogByIdOutput[];

  beforeEach(() => {
    mockWorkInstructions = [
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workInstructionNumber: 'WI-001',
        workName: 'Assembly Task 1',
        workDescription: 'Test assembly work',
        plannedStartDateTime: '2024-01-10T08:00:00Z',
        plannedEndDateTime: '2024-01-10T16:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'IN_PROGRESS',
        progressRate: 65,
        requiredWorkerCount: 2,
        priority: 'HIGH',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
        createdBy: 'ADMIN001',
        updatedBy: 'USER123',
      },
      {
        workInstructionId: 'WI002',
        facilityId: 'FAC002',
        teamId: 'TEAM001',
        workInstructionNumber: 'WI-002',
        workName: 'Assembly Task 2',
        workDescription: 'Test assembly work 2',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T16:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'IN_PROGRESS',
        progressRate: 75,
        requiredWorkerCount: 3,
        priority: 'MEDIUM',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'ADMIN001',
        updatedBy: 'USER123',
      },
      {
        workInstructionId: 'WI003',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workInstructionNumber: 'WI-003',
        workName: 'Assembly Task 3',
        workDescription: 'Test assembly work 3',
        plannedStartDateTime: '2024-01-20T08:00:00Z',
        plannedEndDateTime: '2024-01-20T16:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'IN_PROGRESS',
        progressRate: 50,
        requiredWorkerCount: 2,
        priority: 'LOW',
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-20T09:00:00Z',
        createdBy: 'ADMIN001',
        updatedBy: 'USER123',
      },
    ];

    mockWorkResults = [
      {
        workResultId: 'WR001',
        workInstructionId: 'WI001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        actualStartDateTime: '2024-01-10T08:00:00Z',
        actualEndDateTime: '2024-01-10T12:00:00Z',
        actualQuantity: 50,
        workStatus: 'IN_PROGRESS',
        defectCount: 0,
        remarks: 'Good progress',
        createdAt: '2024-01-10T12:00:00Z',
        updatedAt: '2024-01-10T12:00:00Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
      {
        workResultId: 'WR002',
        workInstructionId: 'WI002',
        workerId: 'WORKER002',
        facilityId: 'FAC002',
        teamId: 'TEAM001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T13:00:00Z',
        actualQuantity: 60,
        workStatus: 'IN_PROGRESS',
        defectCount: 1,
        remarks: 'On track',
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        createdBy: 'WORKER002',
        updatedBy: null,
      },
      {
        workResultId: 'WR003',
        workInstructionId: 'WI003',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        actualStartDateTime: '2024-01-20T08:00:00Z',
        actualEndDateTime: '2024-01-20T14:00:00Z',
        actualQuantity: 40,
        workStatus: 'IN_PROGRESS',
        defectCount: 0,
        remarks: null,
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
    ];

    mockProductivityData = [
      {
        productivityDataId: 'PD001',
        workResultId: 'WR001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workDate: '2024-01-10',
        plannedWorkTime: 480,
        actualWorkTime: 240,
        completedItemCount: 50,
        productivityRate: 95,
        qualityScore: 98,
        errorCount: 0,
        proficiencyLevel: 'ADVANCED',
        remarks: null,
        createdAt: '2024-01-10T12:00:00Z',
        updatedAt: '2024-01-10T12:00:00Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
      {
        productivityDataId: 'PD002',
        workResultId: 'WR002',
        workerId: 'WORKER002',
        facilityId: 'FAC002',
        teamId: 'TEAM001',
        workDate: '2024-01-15',
        plannedWorkTime: 480,
        actualWorkTime: 300,
        completedItemCount: 60,
        productivityRate: 92,
        qualityScore: 95,
        errorCount: 1,
        proficiencyLevel: 'INTERMEDIATE',
        remarks: null,
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        createdBy: 'WORKER002',
        updatedBy: null,
      },
      {
        productivityDataId: 'PD003',
        workResultId: 'WR003',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workDate: '2024-01-20',
        plannedWorkTime: 480,
        actualWorkTime: 360,
        completedItemCount: 40,
        productivityRate: 85,
        qualityScore: 96,
        errorCount: 0,
        proficiencyLevel: 'ADVANCED',
        remarks: null,
        createdAt: '2024-01-20T14:00:00Z',
        updatedAt: '2024-01-20T14:00:00Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
    ];

    mockHandyTerminalLogs = [
      {
        handyTerminalSyncLogId: 'HTS001',
        workerId: 'WORKER001',
        handyTerminalId: 'HT001',
        facilityId: 'FAC001',
        syncType: 'work_result',
        workInstructionId: 'WI001',
        syncContent: JSON.stringify({ quantity: 50 }),
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-10T12:00:00Z',
        receivedDateTime: '2024-01-10T12:00:01Z',
        processingCompletedDateTime: '2024-01-10T12:00:02Z',
        retryCount: 0,
        createdAt: '2024-01-10T12:00:02Z',
        updatedAt: '2024-01-10T12:00:02Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'HTS002',
        workerId: 'WORKER002',
        handyTerminalId: 'HT002',
        facilityId: 'FAC002',
        syncType: 'work_result',
        workInstructionId: 'WI002',
        syncContent: JSON.stringify({ quantity: 60 }),
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-15T13:00:00Z',
        receivedDateTime: '2024-01-15T13:00:01Z',
        processingCompletedDateTime: '2024-01-15T13:00:02Z',
        retryCount: 0,
        createdAt: '2024-01-15T13:00:02Z',
        updatedAt: '2024-01-15T13:00:02Z',
        createdBy: 'WORKER002',
        updatedBy: null,
      },
      {
        handyTerminalSyncLogId: 'HTS003',
        workerId: 'WORKER001',
        handyTerminalId: 'HT001',
        facilityId: 'FAC001',
        syncType: 'work_result',
        workInstructionId: 'WI003',
        syncContent: JSON.stringify({ quantity: 40 }),
        syncStatus: 'success',
        errorMessage: null,
        sentDateTime: '2024-01-20T14:00:00Z',
        receivedDateTime: '2024-01-20T14:00:01Z',
        processingCompletedDateTime: '2024-01-20T14:00:02Z',
        retryCount: 0,
        createdAt: '2024-01-20T14:00:02Z',
        updatedAt: '2024-01-20T14:00:02Z',
        createdBy: 'WORKER001',
        updatedBy: null,
      },
    ];

    jest.spyOn(require('../../src/logic/data-persistence'), 'listWorkInstructionsByCondition').mockResolvedValue({
      workInstructions: mockWorkInstructions,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(require('../../src/logic/data-persistence'), 'listWorkResultsByCondition').mockResolvedValue({
      workResults: mockWorkResults,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(require('../../src/logic/data-persistence'), 'listProductivityDataByCondition').mockResolvedValue({
      productivityDataList: mockProductivityData,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    });

    jest.spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition').mockResolvedValue({
      handyTerminalSyncLogs: mockHandyTerminalLogs,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: new Date().toISOString(),
    });
  });

  it('複数の検索条件が全てAND結合で絞り込まれ、条件を満たすレコードのみが抽出される', async () => {
    const input: ExportWorkInstructionAndResultsToCSVInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: ['TEAM001'],
      progressStatuses: ['IN_PROGRESS'],
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      plannedStartToDateTime: '2024-01-31T23:59:59Z',
      minProgressRate: 50,
      maxProgressRate: 100,
      exportedBy: 'USER123',
    };

    const output: ExportWorkInstructionAndResultsToCSVOutput = await exportWorkInstructionAndResultsToCSV(input);

    expect(output).toBeDefined();
    expect(output.csvBinaryStream).toBeInstanceOf(Buffer);
    expect(output.fileName).toMatch(/^work_instruction_results_\d{8}_\d{6}\.csv$/);
    expect(output.mimeType).toBe('text/csv');
    expect(output.recordCount).toBe(3);
    expect(output.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(output.exportedBy).toBe('USER123');
  });

  it('CSVバイナリストリームが正しくデコード可能で、全てのレコードが検索条件を満たす', async () => {
    const input: ExportWorkInstructionAndResultsToCSVInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: ['TEAM001'],
      progressStatuses: ['IN_PROGRESS'],
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      plannedStartToDateTime: '2024-01-31T23:59:59Z',
      minProgressRate: 50,
      maxProgressRate: 100,
      exportedBy: 'USER123',
    };

    const output = await exportWorkInstructionAndResultsToCSV(input);

    const csvString = output.csvBinaryStream.toString('utf-8');
    const lines = csvString.split('\n').filter((line) => line.trim());

    expect(lines.length).toBeGreaterThanOrEqual(4); // ヘッダー + 3データ行
    expect(lines[0]).toContain('workInstructionId'); // ヘッダー行の存在

    const dataLines = lines.slice(1, 4);
    expect(dataLines.length).toBe(3);

    dataLines.forEach((line) => {
      const fields = line.split(',');
      const facilityId = fields[fields.findIndex((f) => f.includes('FAC001') || f.includes('FAC002'))];
      const teamId = fields[fields.findIndex((f) => f.includes('TEAM001'))];
      const progressStatus = fields[fields.findIndex((f) => f.includes('IN_PROGRESS'))];

      expect(['FAC001', 'FAC002']).toContain(facilityId);
      expect(teamId).toContain('TEAM001');
      expect(progressStatus).toContain('IN_PROGRESS');
    });
  });

  it('出力型の全フィールドが正しく設定される', async () => {
    const input: ExportWorkInstructionAndResultsToCSVInput = {
      facilityIds: ['FAC001', 'FAC002'],
      teamIds: ['TEAM001'],
      progressStatuses: ['IN_PROGRESS'],
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      plannedStartToDateTime: '2024-01-31T23:59:59Z',
      minProgressRate: 50,
      maxProgressRate: 100,
      exportedBy: 'USER123',
    };

    const output = await exportWorkInstructionAndResultsToCSV(input);

    expect(output.csvBinaryStream).toBeInstanceOf(Buffer);
    expect(output.csvBinaryStream.length).toBeGreaterThan(0);
    expect(output.fileName).toBeTruthy();
    expect(output.mimeType).toBe('text/csv');
    expect(output.recordCount).toBe(3);
    expect(output.exportedAt).toBeTruthy();
    expect(new Date(output.exportedAt)).toBeInstanceOf(Date);
    expect(output.exportedBy).toBe('USER123');
  });
});