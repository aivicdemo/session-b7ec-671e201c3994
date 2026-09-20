import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as orchestratorModule from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-021: executionTimestamp にISO 8601形式のタイムスタンプが格納される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系：executionTimestamp にISO 8601形式のタイムスタンプが格納される', async () => {
    const mockAuthorizeOperation = jest
      .spyOn(orchestratorModule, 'authorizeOperation' as any)
      .mockResolvedValue({
        authorized: true,
      });

    const mockMonitorAndJudgeDelayRisk = jest
      .spyOn(orchestratorModule, 'monitorAndJudgeDelayRisk' as any)
      .mockResolvedValue({
        detectionTimestamp: new Date().toISOString(),
        delayDetected: true,
        affectedFacilities: [
          {
            facilityId: 'facility-A',
            facilityName: 'Facility A',
            riskScore: 75,
            riskRank: 1,
            delayReasons: ['insufficient_personnel'],
            affectedTeams: [
              {
                teamId: 'team-1',
                teamName: 'Team 1',
                progressRate: 40,
                plannedProgressRate: 60,
                delayDays: 2,
                qualityScore: 70,
              },
            ],
          },
        ],
        qualityVarianceDetected: true,
        overallRiskScore: 75,
      });

    const mockGenerateAllocationPlans = jest
      .spyOn(orchestratorModule, 'generateAllocationPlans' as any)
      .mockResolvedValue([
        {
          planId: 'plan-1',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'work-1',
          proposedAllocations: [
            {
              workerId: 'worker-1',
              workerName: 'Worker 1',
              assignedWorkType: 'assembly',
              proficiencyLevel: 'intermediate',
              adjustedDifficulty: 'normal',
              estimatedWorkHours: 8,
              productivityRate: 85,
            },
          ],
          feasibilityScore: 90,
          recommendationRank: 1,
          estimatedCompletionDate: '2025-01-20T00:00:00Z',
          proficiencyAdjustmentApplied: true,
        },
        {
          planId: 'plan-2',
          facilityId: 'facility-A',
          teamId: 'team-1',
          workInstructionId: 'work-1',
          proposedAllocations: [
            {
              workerId: 'worker-2',
              workerName: 'Worker 2',
              assignedWorkType: 'assembly',
              proficiencyLevel: 'beginner',
              adjustedDifficulty: 'easy',
              estimatedWorkHours: 10,
              productivityRate: 70,
            },
          ],
          feasibilityScore: 75,
          recommendationRank: 2,
          estimatedCompletionDate: '2025-01-22T00:00:00Z',
          proficiencyAdjustmentApplied: true,
        },
      ]);

    const mockJudgeAllocationPlanApprovalWithCriteria = jest
      .spyOn(orchestratorModule, 'judgeAllocationPlanApprovalWithCriteria' as any)
      .mockResolvedValue([
        {
          planId: 'plan-1',
          approvalStatus: 'auto_approved',
          approvalTimestamp: new Date().toISOString(),
          approverUserId: null,
        },
      ]);

    const mockDeliverAllocationPlanAndWorkInstructions = jest
      .spyOn(orchestratorModule, 'deliverAllocationPlanAndWorkInstructions' as any)
      .mockResolvedValue([
        {
          deliveryId: 'delivery-1',
          planId: 'plan-1',
          targetFieldLeaderId: 'leader-1',
          deliveryStatus: 'delivered',
          deliveryTimestamp: new Date().toISOString(),
          receptionConfirmed: true,
          receptionConfirmationTimestamp: new Date().toISOString(),
          executionStarted: true,
          executionStartTimestamp: new Date().toISOString(),
        },
      ]);

    const mockRecordOperationAudit = jest
      .spyOn(orchestratorModule, 'recordOperationAudit' as any)
      .mockResolvedValue({
        auditId: 'audit-1',
        recorded: true,
      });

    const mockDeliverAllocationInstructionToFieldLeader = jest
      .spyOn(orchestratorModule, 'deliverAllocationInstructionToFieldLeader' as any)
      .mockResolvedValue({
        success: true,
        deliveryTimestamp: new Date().toISOString(),
      });

    const testStartTime = new Date().getTime();

    const input = {
      executorUserId: 'user-001',
      targetFacilityIds: ['facility-A'],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const output = await runTx1Imp1Agent(input);

    const testEndTime = new Date().getTime();

    expect(output).toBeDefined();
    expect(output.executionStatus).toBe('completed');
    expect(output.executionTimestamp).toBeDefined();
    expect(typeof output.executionTimestamp).toBe('string');

    const iso8601Regex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?(Z)$/;
    expect(output.executionTimestamp).toMatch(iso8601Regex);

    const executionTimestamp = new Date(output.executionTimestamp);
    expect(!isNaN(executionTimestamp.getTime())).toBe(true);

    const executionTime = executionTimestamp.getTime();
    const fiveSecondsMs = 5000;

    expect(executionTime).toBeGreaterThanOrEqual(testStartTime - fiveSecondsMs);
    expect(executionTime).toBeLessThanOrEqual(testEndTime + fiveSecondsMs);

    const dateMatch = output.executionTimestamp.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?(Z)$/
    );
    expect(dateMatch).not.toBeNull();

    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);
      const hour = parseInt(dateMatch[4], 10);
      const minute = parseInt(dateMatch[5], 10);
      const second = parseInt(dateMatch[6], 10);

      expect(year).toBeGreaterThanOrEqual(2000);
      expect(year).toBeLessThanOrEqual(2100);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThanOrEqual(59);
      expect(second).toBeGreaterThanOrEqual(0);
      expect(second).toBeLessThanOrEqual(59);
    }

    mockAuthorizeOperation.mockRestore();
    mockMonitorAndJudgeDelayRisk.mockRestore();
    mockGenerateAllocationPlans.mockRestore();
    mockJudgeAllocationPlanApprovalWithCriteria.mockRestore();
    mockDeliverAllocationPlanAndWorkInstructions.mockRestore();
    mockRecordOperationAudit.mockRestore();
    mockDeliverAllocationInstructionToFieldLeader.mockRestore();
  });
});