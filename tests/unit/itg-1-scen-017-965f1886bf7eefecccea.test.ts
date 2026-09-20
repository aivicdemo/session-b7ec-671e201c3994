import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { Tx1Imp1AgentInput, Tx1Imp1AgentOutput, ExecutionError } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('SCEN-017: 部分失敗系 - 複数拠点で異なる理由でエラーが発生した場合', () => {
  const facilityA = 'facility-a-uuid';
  const facilityB = 'facility-b-uuid';
  const facilityC = 'facility-c-uuid';
  const executorUserId = 'executor-user-uuid';

  let mockAuthorizeOperation: jest.Mock;
  let mockMonitorAndJudgeDelayRisk: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockJudgeAllocationPlanApprovalWithCriteria: jest.Mock;
  let mockDeliverAllocationPlanAndWorkInstructions: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    mockMonitorAndJudgeDelayRisk = jest.fn().mockImplementation((input) => {
      const facilityId = input.facilityId;
      if (facilityId === facilityA) {
        return Promise.resolve({
          detectionTimestamp: new Date().toISOString(),
          delayDetected: true,
          affectedFacilities: [
            {
              facilityId: facilityA,
              facilityName: 'Facility A',
              riskScore: 75,
              riskRank: 1,
              delayReasons: ['insufficient_personnel'],
              affectedTeams: [
                {
                  teamId: 'team-a1',
                  teamName: 'Team A1',
                  progressRate: 45,
                  plannedProgressRate: 70,
                  delayDays: 2,
                  qualityScore: 85,
                },
              ],
            },
          ],
          qualityVarianceDetected: false,
          overallRiskScore: 75,
        });
      } else if (facilityId === facilityB) {
        const error = new Error('進捗データの取得に失敗しました。連携ログを確認してください。');
        (error as any).errorCode = 'ProgressDataRetrievalError';
        (error as any).affectedFacilityId = facilityB;
        return Promise.reject(error);
      } else if (facilityId === facilityC) {
        const error = new Error('遅延リスク判定に失敗しました。システム管理者に報告してください。');
        (error as any).errorCode = 'DelayDetectionFailureError';
        (error as any).affectedFacilityId = facilityC;
        return Promise.reject(error);
      }
      return Promise.resolve({
        detectionTimestamp: new Date().toISOString(),
        delayDetected: false,
        affectedFacilities: [],
        qualityVarianceDetected: false,
        overallRiskScore: 0,
      });
    });

    mockGenerateAllocationPlans = jest.fn().mockImplementation((input) => {
      const facilityId = input.facilityId;
      if (facilityId === facilityA) {
        return Promise.resolve([
          {
            planId: 'plan-a1',
            facilityId: facilityA,
            teamId: 'team-a1',
            workInstructionId: 'work-inst-a1',
            proposedAllocations: [
              {
                workerId: 'worker-a1',
                workerName: 'Worker A1',
                assignedWorkType: 'assembly',
                proficiencyLevel: 'intermediate',
                adjustedDifficulty: 'normal',
                estimatedWorkHours: 8,
                productivityRate: 90,
              },
            ],
            feasibilityScore: 88,
            recommendationRank: 1,
            estimatedCompletionDate: new Date(Date.now() + 86400000).toISOString(),
            proficiencyAdjustmentApplied: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    mockJudgeAllocationPlanApprovalWithCriteria = jest.fn().mockImplementation((plans) => {
      return Promise.resolve(
        plans.map((plan) => ({
          planId: plan.planId,
          approvalStatus: 'auto_approved' as const,
          approvalTimestamp: new Date().toISOString(),
          approverUserId: null,
        }))
      );
    });

    mockDeliverAllocationPlanAndWorkInstructions = jest.fn().mockImplementation((approvedPlans) => {
      const results = [];
      for (const plan of approvedPlans) {
        if (plan.facilityId === facilityA) {
          results.push({
            deliveryId: `delivery-${plan.planId}`,
            planId: plan.planId,
            targetFieldLeaderId: 'field-leader-id',
            deliveryStatus: 'delivery_failed' as const,
            deliveryTimestamp: new Date().toISOString(),
            receptionConfirmed: false,
            receptionConfirmationTimestamp: null,
            executionStarted: false,
            executionStartTimestamp: null,
          });
        } else {
          results.push({
            deliveryId: `delivery-${plan.planId}`,
            planId: plan.planId,
            targetFieldLeaderId: 'field-leader-id',
            deliveryStatus: 'delivered' as const,
            deliveryTimestamp: new Date().toISOString(),
            receptionConfirmed: false,
            receptionConfirmationTimestamp: null,
            executionStarted: false,
            executionStartTimestamp: null,
          });
        }
      }
      return Promise.resolve(results);
    });

    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);
  });

  it('should return partial_failure status with multiple execution errors from different facilities', async () => {
    const input: Tx1Imp1AgentInput = {
      executorUserId,
      targetFacilityIds: [facilityA, facilityB, facilityC],
      targetTeamIds: undefined,
      monitoringWindowMinutes: 60,
      delayRiskThreshold: 60,
      qualityVarianceThreshold: 15,
      autoApprovalEnabled: true,
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, {
      authorizeOperation: mockAuthorizeOperation,
      monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
      recordOperationAudit: mockRecordOperationAudit,
    });

    expect(result.executionStatus).toBe('partial_failure');

    expect(result.executionErrors).toBeDefined();
    expect(result.executionErrors).toHaveLength(3);

    const error1 = result.executionErrors?.find(
      (e) => e.affectedFacilityId === facilityB && e.errorCode === 'ProgressDataRetrievalError'
    );
    expect(error1).toBeDefined();
    expect(error1?.errorMessage).toBe('進捗データの取得に失敗しました。連携ログを確認してください。');
    expect(error1?.affectedFacilityId).toBe(facilityB);
    expect(error1?.affectedTeamId).toBeUndefined();
    expect(error1?.errorTimestamp).toBeDefined();
    expect(() => new Date(error1?.errorTimestamp || '')).not.toThrow();

    const error2 = result.executionErrors?.find(
      (e) => e.affectedFacilityId === facilityC && e.errorCode === 'DelayDetectionFailureError'
    );
    expect(error2).toBeDefined();
    expect(error2?.errorMessage).toBe('遅延リスク判定に失敗しました。システム管理者に報告してください。');
    expect(error2?.affectedFacilityId).toBe(facilityC);
    expect(error2?.affectedTeamId).toBeUndefined();
    expect(error2?.errorTimestamp).toBeDefined();
    expect(() => new Date(error2?.errorTimestamp || '')).not.toThrow();

    const error3 = result.executionErrors?.find(
      (e) => e.affectedFacilityId === facilityA && e.errorCode === 'DeliveryInstructionFailureError'
    );
    expect(error3).toBeDefined();
    expect(error3?.errorMessage).toBe('配置指示の配信に失敗しました。現場リーダーへの手動通知を検討してください。');
    expect(error3?.affectedFacilityId).toBe(facilityA);
    expect(error3?.affectedTeamId).toBeUndefined();
    expect(error3?.errorTimestamp).toBeDefined();
    expect(() => new Date(error3?.errorTimestamp || '')).not.toThrow();

    expect(result.delayDetectionResult.delayDetected).toBe(true);
    expect(result.delayDetectionResult.affectedFacilities).toHaveLength(1);
    expect(result.delayDetectionResult.affectedFacilities[0].facilityId).toBe(facilityA);
    expect(result.delayDetectionResult.affectedFacilities[0].facilityName).toBe('Facility A');
    expect(result.delayDetectionResult.affectedFacilities[0].riskScore).toBe(75);

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);
    const facilityAPlans = result.generatedAllocationPlans.filter((p) => p.facilityId === facilityA);
    expect(facilityAPlans.length).toBeGreaterThan(0);
    expect(facilityAPlans[0].planId).toBe('plan-a1');
    expect(facilityAPlans[0].teamId).toBe('team-a1');

    expect(result.approvedAllocationPlans).toBeDefined();
    expect(result.approvedAllocationPlans.length).toBeGreaterThan(0);
    const approvedPlanA = result.approvedAllocationPlans.find((p) => p.planId === 'plan-a1');
    expect(approvedPlanA).toBeDefined();
    expect(approvedPlanA?.approvalStatus).toBe('auto_approved');
    expect(approvedPlanA?.approverUserId).toBeNull();
    expect(approvedPlanA?.approvalTimestamp).toBeDefined();

    expect(result.deliveryResults).toBeDefined();
    const facilityADeliveryResults = result.deliveryResults.filter((d) => d.planId === 'plan-a1');
    expect(facilityADeliveryResults.length).toBeGreaterThan(0);
    expect(facilityADeliveryResults[0].deliveryStatus).toBe('delivery_failed');

    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    expect(result.executionTimestamp).toBeDefined();
    expect(() => new Date(result.executionTimestamp)).not.toThrow();
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockAuthorizeOperation).toHaveBeenCalledWith(executorUserId);

    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledTimes(3);
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledWith(expect.objectContaining({ facilityId: facilityA }));
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledWith(expect.objectContaining({ facilityId: facilityB }));
    expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalledWith(expect.objectContaining({ facilityId: facilityC }));

    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    const generateCallsForFacilityA = mockGenerateAllocationPlans.mock.calls.filter(
      (call) => call[0]?.facilityId === facilityA
    );
    expect(generateCallsForFacilityA.length).toBeGreaterThan(0);

    const generateCallsForFacilityB = mockGenerateAllocationPlans.mock.calls.filter(
      (call) => call[0]?.facilityId === facilityB
    );
    expect(generateCallsForFacilityB.length).toBe(0);

    const generateCallsForFacilityC = mockGenerateAllocationPlans.mock.calls.filter(
      (call) => call[0]?.facilityId === facilityC
    );
    expect(generateCallsForFacilityC.length).toBe(0);

    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });
});