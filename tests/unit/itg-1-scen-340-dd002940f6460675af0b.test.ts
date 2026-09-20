import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-340: ハンディターミナルとWMSデータ矛盾検知', () => {
  it('同一作業指示に対してハンディターミナルとWMSから異なる数量が取得された場合、DataSyncConflictErrorが発生する', async () => {
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
        remarks: 'Handy terminal record',
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
        completedQuantity: 95,
        defectQuantity: 2,
        remarks: 'WMS record',
      },
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'USER001';

    let errorThrown = false;
    let errorMessage = '';

    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults,
        wmsWorkResults,
        aggregationDate,
        executingUserId,
      });
    } catch (error: unknown) {
      errorThrown = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toContain('ハンディターミナルとWMSのデータが矛盾しています');
    expect(errorMessage).toContain('WI-001');
    expect(errorMessage).toContain('100');
    expect(errorMessage).toContain('95');
  });
});