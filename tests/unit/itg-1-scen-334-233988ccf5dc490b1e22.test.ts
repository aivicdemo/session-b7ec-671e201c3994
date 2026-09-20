import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-334: WMSデータの日時範囲が不正な場合、データ形式エラーが発生する', () => {
  it('should throw InvalidWorkResultDataError when WMS data has invalid datetime range', async () => {
    const invalidWmsData = [
      {
        workInstructionId: 'instr-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T10:00:00Z',
        workEndDateTime: '2024-01-15T09:00:00Z',
        completedQuantity: 100,
        defectQuantity: 5,
        remarks: 'Test data with invalid datetime range'
      }
    ];

    const validHandyTerminalData = [
      {
        workInstructionId: 'instr-002',
        workerId: 'worker-002',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workStartDateTime: '2024-01-15T08:00:00Z',
        workEndDateTime: '2024-01-15T12:00:00Z',
        completedQuantity: 150,
        defectQuantity: 3,
        errorCount: 1,
        remarks: 'Valid handy terminal data'
      }
    ];

    const aggregationDate = '2024-01-15';
    const executingUserId = 'audit-user-001';

    let error: any;
    try {
      await aggregateWorkResultsAndCalculateProductivity({
        handyTerminalWorkResults: validHandyTerminalData,
        wmsWorkResults: invalidWmsData,
        aggregationDate,
        executingUserId
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('InvalidWorkResultDataError');
    expect(error.message).toContain('作業実績データの形式が不正です');
    expect(error.message).toContain('workStartDateTime');
    expect(error.message).toContain('workEndDateTime');
    expect(error.message).toContain('ISO 8601形式');
    expect(error.message).toContain('開始時刻 ≤ 終了時刻');
    expect(error.message).toContain('2024-01-15T10:00:00Z');
    expect(error.message).toContain('2024-01-15T09:00:00Z');
  });
});