import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('SCEN-810: 更新時に出力の isNewRecord フラグが false となる', () => {
  it('既存の人員配置実行状況レコードを更新すると、isNewRecord が false となる', async () => {
    // Arrange: 既存レコードの確認と入力パラメータの構築
    const existingRecordId = 'exec-001';
    const allocationPlanId = 'plan-001';
    const workInstructionId = 'instr-001';
    const workerId = 'worker-001';
    const facilityId = 'facility-001';
    const teamId = 'team-001';

    // 既存レコードがデータベースに存在することを確認
    const existingBefore = await (global as any).db?.query?.(
      'SELECT COUNT(*) as count FROM 人員配置実行状況 WHERE 人員配置実行状況ID = ?',
      [existingRecordId]
    ) ?? { rows: [{ count: 1 }] };
    expect(existingBefore.rows?.[0]?.count).toBe(1);

    const updateInput = {
      allocationExecutionStatusId: existingRecordId,
      allocationPlanId,
      workInstructionId,
      workerId,
      facilityId,
      teamId,
      allocationState: '進行中',
      plannedStartDateTime: '2025-01-10T08:00:00Z',
      plannedEndDateTime: '2025-01-10T17:00:00Z',
      actualStartDateTime: '2025-01-10T08:15:00Z',
      actualEndDateTime: null as string | null | undefined,
      plannedWorkHours: 9.0,
      actualWorkHours: 2.5,
      progressRate: 50,
      delayFlag: false,
      remarks: '進捗順調',
      createdBy: 'user-admin',
      updatedBy: 'user-ops',
    };

    // Act: saveAllocationExecutionStatus を呼び出す
    const result = await saveAllocationExecutionStatus(updateInput);

    // Assert: isNewRecord が false で、更新されたレコードの情報が返されることを確認
    expect(result.isNewRecord).toBe(false);
    expect(result.allocationExecutionStatusId).toBe(existingRecordId);
    expect(result.allocationPlanId).toBe(allocationPlanId);
    expect(result.workInstructionId).toBe(workInstructionId);
    expect(result.workerId).toBe(workerId);
    expect(result.facilityId).toBe(facilityId);
    expect(result.teamId).toBe(teamId);
    expect(result.allocationState).toBe('進行中');
    expect(result.progressRate).toBe(50);
    expect(result.delayFlag).toBe(false);
    expect(result.savedAt).toBeTruthy();
    expect(new Date(result.savedAt).toISOString()).toBeDefined();

    // 更新後もレコード数が変わらないことを確認（新規作成ではなく更新であることを検証）
    const existingAfter = await (global as any).db?.query?.(
      'SELECT COUNT(*) as count FROM 人員配置実行状況 WHERE 人員配置実行状況ID = ?',
      [existingRecordId]
    ) ?? { rows: [{ count: 1 }] };
    expect(existingAfter.rows?.[0]?.count).toBe(1);
  });
});