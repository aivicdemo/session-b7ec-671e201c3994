import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-343: 集約処理の統計情報が出力に含まれ、処理件数と成功件数が正確に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate work results and calculate productivity metrics with correct statistics', async () => {
    // テスト入力データの構成
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 100,
        defectQuantity: 2,
        errorCount: 0,
        remarks: 'Handy Terminal Record 1',
      },
      {
        workInstructionId: 'WI-002',
        workerId: 'W002',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:15:00Z',
        workEndDateTime: '2024-01-15T12:30:00Z',
        completedQuantity: 150,
        defectQuantity: 5,
        errorCount: 1,
        remarks: 'Handy Terminal Record 2',
      },
      {
        workInstructionId: 'WI-001',
        workerId: 'W003',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T13:00:00Z',
        completedQuantity: 120,
        defectQuantity: 1,
        errorCount: 0,
        remarks: 'Handy Terminal Record 3',
      },
    ];

    const wmsWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'W001',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 100,
        defectQuantity: 2,
        remarks: 'WMS Record 1',
      },
      {
        workInstructionId: 'WI-002',
        workerId: 'W002',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T08:15:00Z',
        workEndDateTime: '2024-01-15T12:30:00Z',
        completedQuantity: 150,
        defectQuantity: 5,
        remarks: 'WMS Record 2',
      },
      {
        workInstructionId: 'WI-001',
        workerId: 'W003',
        facilityId: 'F001',
        teamId: 'T001',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T13:00:00Z',
        completedQuantity: 120,
        defectQuantity: 1,
        remarks: 'WMS Record 3',
      },
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'ADMIN001';

    const input = {
      handyTerminalWorkResults,
      wmsWorkResults,
      aggregationDate,
      executingUserId,
    };

    // 処理を実行
    const output = await aggregateWorkResultsAndCalculateProductivity(input);

    // 出力の検証
    expect(output).toBeDefined();

    // processingStatisticsの検証
    expect(output.processingStatistics).toBeDefined();
    expect(output.processingStatistics.totalRecordsProcessed).toBe(6); // handyTerminal 3件 + wms 3件
    expect(output.processingStatistics.successfullyAggregated).toBe(3); // 3人の作業者の生産性データ
    expect(output.processingStatistics.failedRecords).toBe(0);
    expect(output.processingStatistics.conflictRecords).toBe(0); // データ矛盾なし
    expect(output.processingStatistics.processingDurationMs).toBeGreaterThan(0);

    // aggregatedProductivityDataの検証
    expect(output.aggregatedProductivityData).toBeDefined();
    expect(output.aggregatedProductivityData).toHaveLength(3);

    // 各レコードの詳細検証
    const [record1, record2, record3] = output.aggregatedProductivityData;

    // W001のデータ検証
    expect(record1.workerId).toBe('W001');
    expect(record1.workDate).toBe('2024-01-15');
    expect(record1.completedCount).toBe(100);
    expect(record1.productivityRate).toBeCloseTo(1.0, 2);
    expect(record1.qualityScore).toBeGreaterThan(0);
    expect(record1.errorCount).toBe(0);
    expect(record1.actualWorkHours).toBeCloseTo(4.0, 1);

    // W002のデータ検証
    expect(record2.workerId).toBe('W002');
    expect(record2.workDate).toBe('2024-01-15');
    expect(record2.completedCount).toBe(150);
    expect(record2.productivityRate).toBeGreaterThan(0);
    expect(record2.qualityScore).toBeGreaterThan(0);
    expect(record2.errorCount).toBe(1);
    expect(record2.actualWorkHours).toBeCloseTo(4.25, 1);

    // W003のデータ検証
    expect(record3.workerId).toBe('W003');
    expect(record3.workDate).toBe('2024-01-15');
    expect(record3.completedCount).toBe(120);
    expect(record3.productivityRate).toBeCloseTo(1.0, 2);
    expect(record3.qualityScore).toBeGreaterThan(0);
    expect(record3.errorCount).toBe(0);
    expect(record3.actualWorkHours).toBeCloseTo(4.0, 1);

    // dataConflictsの検証
    expect(output.dataConflicts).toBeUndefined();

    // persistenceResultの検証
    expect(output.persistenceResult).toBeDefined();
    expect(output.persistenceResult.savedProductivityRecords).toBe(3);
    expect(output.persistenceResult.savedWorkResultRecords).toBeGreaterThanOrEqual(0);
    expect(output.persistenceResult.persistenceStatus).toBe('success');
  });
});