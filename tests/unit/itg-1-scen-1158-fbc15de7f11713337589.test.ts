import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  exportWorkInstructionAndResultsToCSV,
  listWorkInstructionsByCondition,
  listWorkResultsByCondition,
  listProductivityDataByCondition,
  listHandyTerminalSyncLogByCondition,
} from '../../src/logic/data-persistence';

describe('SCEN-1158: ExportWorkInstructionAndResultsToCSV - ソート条件に基づくCSVレコード並べ替え', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたソート条件に基づいてCSVレコードが並べられる', async () => {
    const userId = 'user-123';

    // ソート対象フィールドの値が'003', '001', '002'の順で入力
    const mockWorkInstructions = [
      {
        workInstructionId: 'wi-003',
        facilityId: 'fac-003',
        teamId: 'team-a',
        workInstructionNumber: 'WI-003',
        workName: 'Work C',
        workDescription: 'Description C',
        plannedStartDateTime: '2024-01-03T08:00:00Z',
        plannedEndDateTime: '2024-01-03T12:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'pending',
        progressRate: 0,
        requiredWorkerCount: 3,
        priority: 'low',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
      {
        workInstructionId: 'wi-001',
        facilityId: 'fac-001',
        teamId: 'team-a',
        workInstructionNumber: 'WI-001',
        workName: 'Work A',
        workDescription: 'Description A',
        plannedStartDateTime: '2024-01-01T08:00:00Z',
        plannedEndDateTime: '2024-01-01T12:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'pending',
        progressRate: 0,
        requiredWorkerCount: 5,
        priority: 'high',
        createdAt: '2024-01-01T08:00:00Z',
        updatedAt: '2024-01-01T08:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
      {
        workInstructionId: 'wi-002',
        facilityId: 'fac-002',
        teamId: 'team-b',
        workInstructionNumber: 'WI-002',
        workName: 'Work B',
        workDescription: 'Description B',
        plannedStartDateTime: '2024-01-02T08:00:00Z',
        plannedEndDateTime: '2024-01-02T12:00:00Z',
        actualStartDateTime: null,
        actualEndDateTime: null,
        progressStatus: 'in_progress',
        progressRate: 50,
        requiredWorkerCount: 4,
        priority: 'medium',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
    ];

    const mockWorkResults = [
      {
        workResultId: 'wr-001',
        workInstructionId: 'wi-001',
        workerId: 'worker-001',
        facilityId: 'fac-001',
        teamId: 'team-a',
        actualStartDateTime: '2024-01-01T08:00:00Z',
        actualEndDateTime: '2024-01-01T10:00:00Z',
        actualQuantity: 50,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'Completed successfully',
        createdAt: '2024-01-01T10:30:00Z',
        updatedAt: '2024-01-01T10:30:00Z',
        createdBy: 'worker-001',
        updatedBy: null,
      },
      {
        workResultId: 'wr-002',
        workInstructionId: 'wi-002',
        workerId: 'worker-002',
        facilityId: 'fac-002',
        teamId: 'team-b',
        actualStartDateTime: '2024-01-02T08:00:00Z',
        actualEndDateTime: '2024-01-02T11:00:00Z',
        actualQuantity: 45,
        workStatus: 'in_progress',
        defectCount: 1,
        remarks: 'In progress',
        createdAt: '2024-01-02T11:30:00Z',
        updatedAt: '2024-01-02T11:30:00Z',
        createdBy: 'worker-002',
        updatedBy: null,
      },
      {
        workResultId: 'wr-003',
        workInstructionId: 'wi-003',
        workerId: 'worker-003',
        facilityId: 'fac-003',
        teamId: 'team-a',
        actualStartDateTime: '2024-01-03T08:00:00Z',
        actualEndDateTime: '2024-01-03T11:30:00Z',
        actualQuantity: 55,
        workStatus: 'completed',
        defectCount: 0,
        remarks: 'Completed',
        createdAt: '2024-01-03T12:00:00Z',
        updatedAt: '2024-01-03T12:00:00Z',
        createdBy: 'worker-003',
        updatedBy: null,
      },
    ];

    jest
      .spyOn(require('../../src/logic/data-persistence'), 'listWorkInstructionsByCondition')
      .mockResolvedValueOnce({
        workInstructions: mockWorkInstructions,
        totalCount: 3,
        pageNumber: null,
        pageSize: null,
        retrievedAt: '2024-01-03T14:00:00Z',
      });

    jest
      .spyOn(require('../../src/logic/data-persistence'), 'listWorkResultsByCondition')
      .mockResolvedValueOnce({
        workResults: mockWorkResults,
        totalCount: 3,
        pageNumber: null,
        pageSize: null,
        retrievedAt: '2024-01-03T14:00:00Z',
      });

    jest
      .spyOn(require('../../src/logic/data-persistence'), 'listProductivityDataByCondition')
      .mockResolvedValueOnce({
        productivityDataList: [],
        totalCount: 0,
        pageNumber: null,
        pageSize: null,
        retrievedAt: '2024-01-03T14:00:00Z',
      });

    jest
      .spyOn(require('../../src/logic/data-persistence'), 'listHandyTerminalSyncLogByCondition')
      .mockResolvedValueOnce({
        handyTerminalSyncLogs: [],
        totalCount: 0,
        pageNumber: null,
        pageSize: null,
        retrievedAt: '2024-01-03T14:00:00Z',
      });

    const result = await exportWorkInstructionAndResultsToCSV({
      workInstructionIds: null,
      facilityIds: null,
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
      sortBy: 'facilityId',
      sortOrder: 'ASC',
      exportedBy: userId,
    });

    expect(result.mimeType).toBe('text/csv');
    expect(result.recordCount).toBe(3);
    expect(result.exportedBy).toBe(userId);
    expect(result.fileName).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // CSVデータをパースして検証
    const csvContent = result.csvBinaryStream.toString('utf-8');
    const lines = csvContent.split('\n').filter((line: string) => line.trim().length > 0);

    // ヘッダーと3行のデータが存在することを確認
    expect(lines.length).toBeGreaterThanOrEqual(4); // ヘッダー + 3データ行

    // ヘッダー行を取得
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h: string) => h.trim());
    
    // facilityIdカラムのインデックスを特定
    const facilityIdIndex = headers.findIndex((h: string) => h.toLowerCase().includes('facility'));
    expect(facilityIdIndex).toBeGreaterThanOrEqual(0);

    // データ行を解析して、facilityIdの値を抽出
    const dataLines = lines.slice(1); // ヘッダーをスキップ
    const facilityIds: string[] = [];

    for (const line of dataLines) {
      const parts = line.split(',').map((p: string) => p.trim());
      if (parts.length > facilityIdIndex && parts[facilityIdIndex]) {
        facilityIds.push(parts[facilityIdIndex]);
      }
    }

    // facilityIdが昇順に並んでいることを確認
    // 期待順序: 'fac-001', 'fac-002', 'fac-003'
    expect(facilityIds[0]).toBe('fac-001');
    expect(facilityIds[1]).toBe('fac-002');
    expect(facilityIds[2]).toBe('fac-003');

    // 昇順であることを確認
    for (let i = 1; i < facilityIds.length; i++) {
      expect(facilityIds[i].localeCompare(facilityIds[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});