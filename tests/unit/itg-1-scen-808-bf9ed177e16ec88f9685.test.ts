import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-808: 人員配置実行状況の更新', () => {
  let testDb: any;

  beforeEach(() => {
    testDb = {
      allocationPlans: [{ allocationPlanId: 'plan-001' }],
      workInstructions: [{ workInstructionId: 'instr-001' }],
      workers: [{ workerId: 'worker-001' }],
      facilities: [{ facilityId: 'facility-001' }],
      teams: [{ teamId: 'team-001' }],
      allocationExecutionStatuses: [
        {
          allocationExecutionStatusId: 'status-001',
          allocationPlanId: 'plan-001',
          workInstructionId: 'instr-001',
          workerId: 'worker-001',
          facilityId: 'facility-001',
          teamId: 'team-001',
          allocationState: '未開始',
          plannedStartDateTime: '2024-01-01T09:00:00Z',
          plannedEndDateTime: '2024-01-01T17:00:00Z',
          actualStartDateTime: null,
          actualEndDateTime: null,
          plannedWorkHours: 8.0,
          actualWorkHours: null,
          progressRate: 0,
          delayFlag: false,
          remarks: '初期作成',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z',
          createdBy: 'user001',
          updatedBy: null,
        },
      ],
    };
  });

  it('既存の人員配置実行状況レコードが入力値で上書き更新されて保存される', async () => {
    const input = {
      allocationExecutionStatusId: 'status-001',
      allocationPlanId: 'plan-001',
      workInstructionId: 'instr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      allocationState: '進行中',
      plannedStartDateTime: '2024-01-01T09:00:00Z',
      plannedEndDateTime: '2024-01-01T17:00:00Z',
      actualStartDateTime: '2024-01-01T09:30:00Z',
      actualEndDateTime: null,
      plannedWorkHours: 8.0,
      actualWorkHours: null,
      progressRate: 45,
      delayFlag: false,
      remarks: '更新テスト',
      createdBy: 'user001',
      updatedBy: 'user002',
    };

    const beforeCount = testDb.allocationExecutionStatuses.length;
    const result = await saveAllocationExecutionStatus(input);

    expect(result.allocationExecutionStatusId).toBe('status-001');
    expect(result.allocationPlanId).toBe('plan-001');
    expect(result.workInstructionId).toBe('instr-001');
    expect(result.workerId).toBe('worker-001');
    expect(result.facilityId).toBe('facility-001');
    expect(result.teamId).toBe('team-001');
    expect(result.allocationState).toBe('進行中');
    expect(result.progressRate).toBe(45);
    expect(result.delayFlag).toBe(false);
    expect(result.isNewRecord).toBe(false);
    expect(result.savedAt).toBeTruthy();

    const afterCount = testDb.allocationExecutionStatuses.length;
    expect(afterCount).toBe(beforeCount);

    const updatedRecord = testDb.allocationExecutionStatuses.find(
      (r: any) => r.allocationExecutionStatusId === 'status-001'
    );
    expect(updatedRecord.allocationState).toBe('進行中');
    expect(updatedRecord.progressRate).toBe(45);
    expect(updatedRecord.actualStartDateTime).toBe('2024-01-01T09:30:00Z');
    expect(updatedRecord.remarks).toBe('更新テスト');
    expect(updatedRecord.updatedBy).toBe('user002');
  });
});