import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-047: 新配属者配属情報の入力検証エラー', () => {
  it('作業者IDが空文字列の場合、InvalidOnboardingDataErrorが発生する', async () => {
    const input = {
      newAssigneeWorkerId: '',
      jobClassification: 'packaging',
      assignedSiteId: 'site-001',
      assignedTeamId: 'team-001',
      assignedDepartmentId: 'dept-001',
      assignmentStartDate: '2024-01-15T09:00:00Z',
      executingUserId: 'user-admin-001',
      historicalDataLookbackDays: 90,
    };

    const result = await runTx5Imp1Agent(input, {} as any);

    expect(result.success).toBe(false);
    expect(result.initialAssignmentId).toBeNull();
    expect(result.errorDetails).toBe('配属情報が不完全です。作業者ID、職務分類、拠点IDを確認してください。');
  });
});