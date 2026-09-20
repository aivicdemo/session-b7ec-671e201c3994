import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-018: 作業進捗・人員配置最適化エンジン - generatedAllocationPlansの検証', () => {
  it('正常系：generatedAllocationPlansには生成された全配置案が格納され、各案に実現可能性スコア・推奨順位・習熟度調整適用状況が含まれる', async () => {
    // テスト用のモック/スタブを準備
    const mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    const mockMonitorAndJudgeDelayRisk = jest.fn().mockResolvedValue({
      delayDetected: true,
      qualityVarianceDetected: true,
      affectedFacilities: [
        {
          facilityId: 'fac001',
          facilityName: 'Facility 1',
          riskScore: 75,
          riskRank: 1,
          delayReasons: ['insufficient_personnel', 'low_productivity'],
          affectedTeams: [
            {
              teamId: 'team001',
              teamName: 'Team A',
              progressRate: 40,
              plannedProgressRate: 60,
              delayDays: 2,
              qualityScore: 55,
            },
          ],
        },
        {
          facilityId: 'fac002',
          facilityName: 'Facility 2',
          riskScore: 68,
          riskRank: 2,
          delayReasons: ['quality_issue'],
          affectedTeams: [
            {
              teamId: 'team002',
              teamName: 'Team B',
              progressRate: 50,
              plannedProgressRate: 70,
              delayDays: 1.5,
              qualityScore: 62,
            },
          ],
        },
      ],
      overallRiskScore: 72,
      detectionTimestamp: new Date().toISOString(),
    });

    const mockGenerateAllocationPlans = jest.fn().mockResolvedValue([
      {
        planId: 'plan001',
        facilityId: 'fac001',
        teamId: 'team001',
        workInstructionId: 'work001',
        proposedAllocations: [
          {
            workerId: 'worker001',
            workerName: 'Worker A',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'intermediate',
            adjustedDifficulty: 'normal',
            estimatedWorkHours: 8,
            productivityRate: 85,
          },
        ],
        feasibilityScore: 85.5,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan002',
        facilityId: 'fac001',
        teamId: 'team001',
        workInstructionId: 'work001',
        proposedAllocations: [
          {
            workerId: 'worker002',
            workerName: 'Worker B',
            assignedWorkType: 'assembly',
            proficiencyLevel: 'beginner',
            adjustedDifficulty: 'easy',
            estimatedWorkHours: 10,
            productivityRate: 70,
          },
        ],
        feasibilityScore: 72.0,
        recommendationRank: 2,
        estimatedCompletionDate: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: true,
      },
      {
        planId: 'plan003',
        facilityId: 'fac002',
        teamId: 'team002',
        workInstructionId: 'work002',
        proposedAllocations: [
          {
            workerId: 'worker003',
            workerName: 'Worker C',
            assignedWorkType: 'quality_check',
            proficiencyLevel: 'advanced',
            adjustedDifficulty: 'hard',
            estimatedWorkHours: 6,
            productivityRate: 95,
          },
        ],
        feasibilityScore: 88.3,
        recommendationRank: 1,
        estimatedCompletionDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        proficiencyAdjustmentApplied: false,
      },
    ]);

    const mockJudgeAllocationPlanApprovalWithCriteria = jest
      .fn()
      .mockResolvedValue([
        {
          planId: 'plan001',
          approvalStatus: 'auto_approved',
          approvalTimestamp: new Date().toISOString(),
          approverUserId: null,
        },
        {
          planId: 'plan003',
          approvalStatus: 'auto_approved',
          approvalTimestamp: new Date().toISOString(),
          approverUserId: null,
        },
      ]);

    const mockDeliverAllocationPlanAndWorkInstructions = jest
      .fn()
      .mockResolvedValue([
        {
          deliveryId: 'deliv001',
          planId: 'plan001',
          targetFieldLeaderId: 'leader001',
          deliveryStatus: 'delivered',
          deliveryTimestamp: new Date().toISOString(),
          receptionConfirmed: true,
          receptionConfirmationTimestamp: new Date().toISOString(),
          executionStarted: true,
          executionStartTimestamp: new Date().toISOString(),
        },
        {
          deliveryId: 'deliv003',
          planId: 'plan003',
          targetFieldLeaderId: 'leader002',
          deliveryStatus: 'delivered',
          deliveryTimestamp: new Date().toISOString(),
          receptionConfirmed: true,
          receptionConfirmationTimestamp: new Date().toISOString(),
          executionStarted: true,
          executionStartTimestamp: new Date().toISOString(),
        },
      ]);

    const mockRecordOperationAudit = jest.fn().mockResolvedValue(true);

    const mockDeliverAllocationInstructionToFieldLeader = jest.fn().mockResolvedValue(true);

    // AIクライアントのモックを構成
    const mockAiClient = {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
    };

    // runTx1Imp1Agentを呼び出す
    const result = await runTx1Imp1Agent(
      {
        executorUserId: 'user001',
        targetFacilityIds: ['fac001', 'fac002'],
        targetTeamIds: ['team001', 'team002'],
        monitoringWindowMinutes: 60,
        delayRiskThreshold: 60,
        qualityVarianceThreshold: 15,
        autoApprovalEnabled: true,
      },
      mockAiClient as any
    );

    // executionStatusが'completed'であることを確認
    expect(result.executionStatus).toBe('completed');

    // executionIdが空文字列でない一意の文字列であることを確認
    expect(result.executionId).toBeTruthy();
    expect(typeof result.executionId).toBe('string');

    // executionTimestampがISO 8601形式のタイムスタンプであることを確認
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // generatedAllocationPlansフィールドが空でないことを確認
    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    // generatedAllocationPlansの各要素が必要な属性を持つことを確認
    result.generatedAllocationPlans.forEach((plan) => {
      // 実現可能性スコアが0～100の数値型であることを確認
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(plan.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(plan.feasibilityScore).toBeLessThanOrEqual(100);

      // 推奨順位が正の整数であることを確認
      expect(typeof plan.recommendationRank).toBe('number');
      expect(Number.isInteger(plan.recommendationRank)).toBe(true);
      expect(plan.recommendationRank).toBeGreaterThan(0);

      // 習熟度調整適用状況がboolean型であることを確認
      expect(typeof plan.proficiencyAdjustmentApplied).toBe('boolean');
    });

    // 推奨順位が複数案間で一意かつ昇順に付与されていることを確認
    const ranks = result.generatedAllocationPlans.map((p) => p.recommendationRank);
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(ranks.length);
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sortedRanks);

    // approvedAllocationPlansが承認されたプランを含むことを確認
    expect(result.approvedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.approvedAllocationPlans)).toBe(true);
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);

    // deliveryResultsが配信結果を含むことを確認
    expect(result.deliveryResults).toBeDefined();
    expect(Array.isArray(result.deliveryResults)).toBe(true);
    expect(result.deliveryResults.length).toBeGreaterThan(0);
  });
});