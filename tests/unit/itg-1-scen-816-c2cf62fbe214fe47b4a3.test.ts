import {
  saveAllocationExecutionStatus,
  SaveAllocationExecutionStatusInput,
} from '../../src/logic/data-persistence';

describe('SCEN-816: saveAllocationExecutionStatus - Invalid DateTime Range', () => {
  it('should throw InvalidAllocationExecutionStatusInput when actualEndDateTime is before actualStartDateTime', async () => {
    const input: SaveAllocationExecutionStatusInput = {
      allocationExecutionStatusId: null,
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-01T08:00:00Z',
      plannedEndDateTime: '2025-01-01T17:00:00Z',
      actualStartDateTime: '2025-01-01T10:00:00Z',
      actualEndDateTime: '2025-01-01T09:00:00Z',
      plannedWorkHours: 9,
      actualWorkHours: null,
      progressRate: 50,
      delayFlag: false,
      remarks: null,
      createdBy: 'user-001',
      updatedBy: null,
    };

    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      /人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。/
    );
  });
});