import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-345: 複数の作業者とチームに対してデータが集約され、作業者別・チーム別の生産性指標が正確に計算される', () => {
  it('ハンディターミナルとWMSから取得した作業実績データを集約・正規化し、作業者の生産性指標を正確に計算して永続化する', async () => {
    // 準備: ハンディターミナルから取得した3件の作業実績データ
    const handyTerminalWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'A',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:00:00Z',
        completedQuantity: 110,
        defectQuantity: 5,
        errorCount: 2,
        remarks: 'Normal completion',
      },
      {
        workInstructionId: 'WI-001',
        workerId: 'B',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T15:30:00Z',
        completedQuantity: 95,
        defectQuantity: 8,
        errorCount: 0,
        remarks: 'Completed as scheduled',
      },
      {
        workInstructionId: 'WI-002',
        workerId: 'A',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 85,
        defectQuantity: 3,
        errorCount: 1,
        remarks: 'Additional task',
      },
    ];

    // 準備: WMSから取得した同期間・同作業指示に対応する3件の作業実績データ
    const wmsWorkResults = [
      {
        workInstructionId: 'WI-001',
        workerId: 'A',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T16:00:00Z',
        completedQuantity: 110,
        defectQuantity: 5,
        remarks: 'WMS record for A',
      },
      {
        workInstructionId: 'WI-001',
        workerId: 'B',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T15:30:00Z',
        completedQuantity: 95,
        defectQuantity: 8,
        remarks: 'WMS record for B',
      },
      {
        workInstructionId: 'WI-002',
        workerId: 'A',
        facilityId: 'FAC-001',
        teamId: 'X',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T17:00:00Z',
        completedQuantity: 85,
        defectQuantity: 3,
        remarks: 'WMS record for additional task',
      },
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'ADMIN001';

    // 実行
    const result = await aggregateWorkResultsAndCalculateProductivity({
      handyTerminalWorkResults,
      wmsWorkResults,
      aggregationDate,
      executingUserId,
    });

    // 検証: aggregatedProductivityData 配列の存在と長さ
    expect(result.aggregatedProductivityData).toBeDefined();
    expect(Array.isArray(result.aggregatedProductivityData)).toBe(true);
    // 作業指示別に集約される場合は3件（WI-001(A), WI-001(B), WI-002(A)）
    expect(result.aggregatedProductivityData.length).toBeGreaterThanOrEqual(2);

    // 作業者A, WI-001のレコードを検証
    const workerAWI001 = result.aggregatedProductivityData.find(
      (r) => r.workerId === 'A' && r.workDate === '2024-01-15' && r.workResultId?.includes('WI-001')
    );
    expect(workerAWI001).toBeDefined();
    expect(workerAWI001?.teamId).toBe('X');
    expect(workerAWI001?.facilityId).toBe('FAC-001');
    expect(workerAWI001?.actualWorkHours).toBe(8); // 08:00 - 16:00
    expect(workerAWI001?.completedCount).toBe(110); // ハンディターミナルとWMSの数量が一致
    expect(workerAWI001?.productivityRate).toBeGreaterThan(100); // 110% 相当
    expect(workerAWI001?.qualityScore).toBeDefined();
    expect(workerAWI001?.errorCount).toBe(2); // ハンディターミナルから取得
    expect(workerAWI001?.proficiencyLevel).toBeDefined();
    expect(workerAWI001?.createdDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 作業者B, WI-001のレコードを検証
    const workerBWI001 = result.aggregatedProductivityData.find(
      (r) => r.workerId === 'B' && r.workDate === '2024-01-15' && r.workResultId?.includes('WI-001')
    );
    expect(workerBWI001).toBeDefined();
    expect(workerBWI001?.teamId).toBe('X');
    expect(workerBWI001?.facilityId).toBe('FAC-001');
    expect(workerBWI001?.actualWorkHours).toBe(7.5); // 08:00 - 15:30
    expect(workerBWI001?.completedCount).toBe(95); // ハンディターミナルとWMSの数量が一致
    expect(workerBWI001?.productivityRate).toBeCloseTo(95, 5);
    expect(workerBWI001?.qualityScore).toBeDefined();
    expect(workerBWI001?.errorCount).toBe(0); // WMSにはエラー件数が含まれていない
    expect(workerBWI001?.proficiencyLevel).toBeDefined();
    expect(workerBWI001?.createdDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 作業者A, WI-002のレコードを検証
    const workerAWI002Records = result.aggregatedProductivityData.filter(
      (r) => r.workerId === 'A' && r.workDate === '2024-01-15' && r.workResultId?.includes('WI-002')
    );
    expect(workerAWI002Records.length).toBeGreaterThanOrEqual(1);
    const workerAWI002 = workerAWI002Records[0];
    expect(workerAWI002).toBeDefined();
    expect(workerAWI002?.teamId).toBe('X');
    expect(workerAWI002?.facilityId).toBe('FAC-001');
    expect(workerAWI002?.actualWorkHours).toBe(8); // 09:00 - 17:00
    expect(workerAWI002?.completedCount).toBe(85);
    expect(workerAWI002?.errorCount).toBe(1); // ハンディターミナルから取得

    // 検証: processingStatistics
    expect(result.processingStatistics).toBeDefined();
    expect(result.processingStatistics.totalRecordsProcessed).toBe(6); // 3件 + 3件
    expect(result.processingStatistics.successfullyAggregated).toBe(6);
    expect(result.processingStatistics.failedRecords).toBe(0);
    expect(result.processingStatistics.conflictRecords).toBe(0); // ハンディターミナルとWMSが一致
    expect(result.processingStatistics.processingDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.processingStatistics.processingDurationMs).toBeLessThan(5000);

    // 検証: persistenceResult
    expect(result.persistenceResult).toBeDefined();
    expect(result.persistenceResult.persistenceStatus).toBe('success');
    expect(result.persistenceResult.savedProductivityRecords).toBeGreaterThanOrEqual(2);
    expect(result.persistenceResult.savedWorkResultRecords).toBe(6);

    // 検証: dataConflicts（矛盾がないため存在しないまたは空配列）
    expect(
      result.dataConflicts === undefined || Array.isArray(result.dataConflicts)
    ).toBe(true);
    if (result.dataConflicts) {
      expect(result.dataConflicts.length).toBe(0);
    }
  });
});