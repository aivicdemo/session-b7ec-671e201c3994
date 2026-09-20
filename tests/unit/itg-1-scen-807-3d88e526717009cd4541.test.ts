import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-807: 新規作成時に必須フィールドが揃い参照先が全て存在する場合、新しい実行状況レコードが生成されて保存される', () => {
  it('should generate and save a new allocation execution status record when all required fields are provided and all references exist', async () => {
    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'PLAN-001',
      workInstructionId: 'INSTR-001',
      workerId: 'WORKER-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-15T09:00:00Z',
      plannedEndDateTime: '2025-01-15T17:00:00Z',
      actualStartDateTime: '2025-01-15T09:05:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8.0,
      actualWorkHours: null,
      progressRate: 25,
      delayFlag: false,
      remarks: '順調に進行中',
      createdBy: 'USER-001',
      updatedBy: null,
    };

    const result = await saveAllocationExecutionStatus(input);

    expect(result).toBeDefined();
    expect(result.allocationExecutionStatusId).toBeDefined();
    expect(typeof result.allocationExecutionStatusId).toBe('string');
    expect(result.allocationExecutionStatusId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.allocationPlanId).toBe('PLAN-001');
    expect(result.workInstructionId).toBe('INSTR-001');
    expect(result.workerId).toBe('WORKER-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');
    expect(result.allocationState).toBe('進行中');
    expect(result.progressRate).toBe(25);
    expect(result.delayFlag).toBe(false);
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(true);
  });
});