import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-074: 複数回連続実行した場合、各実行の初期割当案IDとタイムスタンプが異なる', () => {
  it('should generate different initialAssignmentIds and executionTimestamps for consecutive executions', async () => {
    const input = {
      newAssigneeWorkerId: 'WKR-NEW-001',
      jobClassification: '仕分け作業',
      assignedSiteId: 'SITE-001',
      assignedTeamId: 'TEAM-A',
      assignedDepartmentId: 'DEPT-01',
      assignmentStartDate: '2025-01-15T00:00:00Z',
      executingUserId: 'USR-ADM-001',
      historicalDataLookbackDays: 90,
    };

    // 1回目実行
    const result1 = await runTx5Imp1Agent(input, {
      analyzeProductivityPatterns: async () => ({
        patterns: [],
      }),
      estimateProficiencyDays: async () => 30,
      generateInitialAssignmentOptions: async () => ({
        options: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'Test Work',
            recommendationReason: 'Test',
            expectedProductivityRate: 80,
          },
        ],
      }),
      notifyApprover: async () => ({ status: 'sent' }),
    });

    expect(result1.success).toBe(true);
    expect(result1.initialAssignmentId).not.toBeNull();
    expect(result1.approverNotificationStatus).toBe('sent');
    expect(result1.errorDetails).toBeNull();

    const firstAssignmentId = result1.initialAssignmentId;
    const firstTimestamp = result1.executionTimestamp;

    // 30秒待機
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // 2回目実行
    const result2 = await runTx5Imp1Agent(input, {
      analyzeProductivityPatterns: async () => ({
        patterns: [],
      }),
      estimateProficiencyDays: async () => 30,
      generateInitialAssignmentOptions: async () => ({
        options: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'Test Work',
            recommendationReason: 'Test',
            expectedProductivityRate: 80,
          },
        ],
      }),
      notifyApprover: async () => ({ status: 'sent' }),
    });

    expect(result2.success).toBe(true);
    expect(result2.initialAssignmentId).not.toBeNull();
    expect(result2.approverNotificationStatus).toBe('sent');
    expect(result2.errorDetails).toBeNull();

    const secondAssignmentId = result2.initialAssignmentId;
    const secondTimestamp = result2.executionTimestamp;

    // 30秒待機
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // 3回目実行
    const result3 = await runTx5Imp1Agent(input, {
      analyzeProductivityPatterns: async () => ({
        patterns: [],
      }),
      estimateProficiencyDays: async () => 30,
      generateInitialAssignmentOptions: async () => ({
        options: [
          {
            workTypeId: 'WT-001',
            workTypeName: 'Test Work',
            recommendationReason: 'Test',
            expectedProductivityRate: 80,
          },
        ],
      }),
      notifyApprover: async () => ({ status: 'sent' }),
    });

    expect(result3.success).toBe(true);
    expect(result3.initialAssignmentId).not.toBeNull();
    expect(result3.approverNotificationStatus).toBe('sent');
    expect(result3.errorDetails).toBeNull();

    const thirdAssignmentId = result3.initialAssignmentId;
    const thirdTimestamp = result3.executionTimestamp;

    // initialAssignmentId の比較検証
    expect(firstAssignmentId).not.toBe(secondAssignmentId);
    expect(secondAssignmentId).not.toBe(thirdAssignmentId);
    expect(firstAssignmentId).not.toBe(thirdAssignmentId);

    // executionTimestamp の比較検証
    const firstTime = new Date(firstTimestamp).getTime();
    const secondTime = new Date(secondTimestamp).getTime();
    const thirdTime = new Date(thirdTimestamp).getTime();

    expect(firstTime).toBeLessThan(secondTime);
    expect(secondTime).toBeLessThan(thirdTime);
  });
});