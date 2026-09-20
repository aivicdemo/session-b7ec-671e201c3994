import { saveWorkResult } from '../../src/logic/data-persistence';

describe('SCEN-711: 実績数量が0の場合は正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save work result successfully with actualQuantity=0 without InvalidWorkResultDataError', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI001',
      workerId: 'WK001',
      facilityId: 'FC001',
      teamId: 'TM001',
      actualStartDateTime: '2024-01-15T08:00:00Z',
      actualEndDateTime: '2024-01-15T09:00:00Z',
      actualQuantity: 0,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR001',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result).toBeDefined();
    expect(result.actualQuantity).toBe(0);
    expect(result.isNewRecord).toBe(true);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.*)Z?$/);
    expect(result.workResultId).toBeDefined();
    expect(result.workInstructionId).toBe(input.workInstructionId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.workStatus).toBe(input.workStatus);
  });

  it('should preserve all fields when saving work result with zero quantity', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI002',
      workerId: 'WK002',
      facilityId: 'FC002',
      teamId: 'TM002',
      actualStartDateTime: '2024-01-15T10:00:00Z',
      actualEndDateTime: '2024-01-15T11:00:00Z',
      actualQuantity: 0,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR002',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result.workInstructionId).toBe(input.workInstructionId);
    expect(result.workerId).toBe(input.workerId);
    expect(result.facilityId).toBe(input.facilityId);
    expect(result.teamId).toBe(input.teamId);
    expect(result.actualQuantity).toBe(0);
    expect(result.workStatus).toBe(input.workStatus);
    expect(result.isNewRecord).toBe(true);
  });

  it('should validate date time range correctly for actualQuantity=0', async () => {
    const input = {
      workResultId: null,
      workInstructionId: 'WI003',
      workerId: 'WK003',
      facilityId: 'FC003',
      teamId: 'TM003',
      actualStartDateTime: '2024-01-15T12:00:00Z',
      actualEndDateTime: '2024-01-15T13:00:00Z',
      actualQuantity: 0,
      workStatus: '完了',
      defectCount: null,
      remarks: null,
      createdBy: 'USR003',
      updatedBy: null,
    };

    const result = await saveWorkResult(input);

    expect(result).toBeDefined();
    expect(new Date(result.savedAt).getTime()).toBeGreaterThan(0);
  });
});