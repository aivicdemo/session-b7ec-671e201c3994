import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-333: ハンディターミナルデータに必須フィールドが欠落している場合、データ形式エラーが発生する', () => {
  it('handyTerminalWorkResults の workerId が undefined の場合、InvalidWorkResultDataError が発生する', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'instr-001',
          workerId: undefined,
          facilityId: 'fac-001',
          teamId: 'team-001',
          workStartDateTime: '2025-01-15T08:00:00Z',
          workEndDateTime: '2025-01-15T12:00:00Z',
          completedQuantity: 100,
          defectQuantity: 5,
          errorCount: 0,
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2025-01-15',
      executingUserId: 'user-12345',
    };

    await expect(
      aggregateWorkResultsAndCalculateProductivity(input)
    ).rejects.toThrow();

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkResultDataError');
      expect(error.message).toContain('作業実績データの形式が不正です');
      expect(error.message).toContain('workerId');
      expect(error.message).toContain('undefined');
    }
  });

  it('handyTerminalWorkResults の workerId が null の場合、InvalidWorkResultDataError が発生する', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'instr-001',
          workerId: null,
          facilityId: 'fac-001',
          teamId: 'team-001',
          workStartDateTime: '2025-01-15T08:00:00Z',
          workEndDateTime: '2025-01-15T12:00:00Z',
          completedQuantity: 100,
          defectQuantity: 5,
          errorCount: 0,
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2025-01-15',
      executingUserId: 'user-12345',
    };

    await expect(
      aggregateWorkResultsAndCalculateProductivity(input)
    ).rejects.toThrow();

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkResultDataError');
      expect(error.message).toContain('作業実績データの形式が不正です');
      expect(error.message).toContain('workerId');
      expect(error.message).toContain('null');
    }
  });

  it('複数の必須フィールドが欠落している場合、最初に検出されたフィールドについてエラーが発生する', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'instr-001',
          workerId: undefined,
          facilityId: undefined,
          teamId: 'team-001',
          workStartDateTime: '2025-01-15T08:00:00Z',
          workEndDateTime: '2025-01-15T12:00:00Z',
          completedQuantity: 100,
          defectQuantity: 5,
          errorCount: 0,
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2025-01-15',
      executingUserId: 'user-12345',
    };

    await expect(
      aggregateWorkResultsAndCalculateProductivity(input)
    ).rejects.toThrow('InvalidWorkResultDataError');
  });

  it('他の必須フィールドが正常な値の場合、workerId エラーだけが報告される', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'instr-001',
          workerId: undefined,
          facilityId: 'fac-001',
          teamId: 'team-001',
          workStartDateTime: '2025-01-15T08:00:00Z',
          workEndDateTime: '2025-01-15T12:00:00Z',
          completedQuantity: 100,
          defectQuantity: 5,
          errorCount: 0,
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2025-01-15',
      executingUserId: 'user-12345',
    };

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.name).toBe('InvalidWorkResultDataError');
      expect(error.message).toContain('必須フィールド: workerId');
    }
  });
});