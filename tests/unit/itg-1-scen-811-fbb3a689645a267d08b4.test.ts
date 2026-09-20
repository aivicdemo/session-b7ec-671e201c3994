import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-811: 計画終了日時を超過している場合、出力の delayFlag が true となる', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('計画終了日時を超過している場合、delayFlag が true となること', async () => {
    const plannedEndDateTime = '2024-01-01T10:00:00Z';
    const actualEndDateTime = '2024-01-01T12:00:00Z';

    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'PLAN001',
      workInstructionId: 'INSTR001',
      workerId: 'WORKER001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      allocationState: '完了',
      plannedStartDateTime: '2024-01-01T08:00:00Z',
      plannedEndDateTime,
      actualStartDateTime: '2024-01-01T08:30:00Z',
      actualEndDateTime,
      plannedWorkHours: 2,
      actualWorkHours: 3.5,
      progressRate: 100,
      delayFlag: true,
      remarks: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    const output = await saveAllocationExecutionStatus(input);

    expect(output.delayFlag).toBe(true);
    expect(output.allocationExecutionStatusId).toBeDefined();
    expect(typeof output.allocationExecutionStatusId).toBe('string');
    expect(output.allocationPlanId).toBe('PLAN001');
    expect(output.workInstructionId).toBe('INSTR001');
    expect(output.workerId).toBe('WORKER001');
    expect(output.facilityId).toBe('FAC001');
    expect(output.teamId).toBe('TEAM001');
    expect(output.allocationState).toBe('完了');
    expect(output.progressRate).toBe(100);
    expect(output.isNewRecord).toBe(true);
    expect(output.savedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(output.savedAt)).toBe(true);
  });
});