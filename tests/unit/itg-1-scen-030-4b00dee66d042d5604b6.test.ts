import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-030: teamIdがnullの場合、拠点全体を対象として配置案が生成される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({ authorized: true }),
      validateReferentialIntegrity: jest.fn().mockResolvedValue({ valid: true }),
      listProductivityDataByCondition: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'prod-001',
            facilityId: 'FAC-001',
            teamId: 'TEAM-A',
            workerId: 'WOR-001',
            workDate: '2025-01-15',
            completedCount: 100,
            plannedCount: 100,
            productivityRate: 95,
            qualityScore: 90,
          },
          {
            id: 'prod-002',
            facilityId: 'FAC-001',
            teamId: 'TEAM-B',
            workerId: 'WOR-002',
            workDate: '2025-01-15',
            completedCount: 80,
            plannedCount: 100,
            productivityRate: 75,
            qualityScore: 85,
          },
        ],
        count: 2,
      }),
      generateAllocationPlans: jest.fn().mockResolvedValue({
        plans: [
          {
            allocationPlanId: 'plan-001',
            planName: '配置案A',
            facilityId: 'FAC-001',
            teamId: null,
            feasibilityScore: 92,
            recommendedRank: 1,
            status: 'generated',
          },
          {
            allocationPlanId: 'plan-002',
            planName: '配置案B',
            facilityId: 'FAC-001',
            teamId: null,
            feasibilityScore: 85,
            recommendedRank: 2,
            status: 'generated',
          },
        ],
      }),
      judgeAllocationPlanApprovalWithCriteria: jest.fn().mockResolvedValue({
        judgement: {
          'plan-001': { approved: true, reason: '基準内', score: 92 },
          'plan-002': { approved: false, reason: '基準外', score: 85 },
        },
      }),
      saveAllocationPlan: jest.fn().mockResolvedValue({
        saved: true,
        planIds: ['plan-001'],
      }),
      deliverAllocationPlanAndWorkInstructions: jest.fn().mockResolvedValue({
        deliveredCount: 1,
        failedCount: 0,
        deliveryStatus: [
          {
            planId: 'plan-001',
            status: 'delivered',
            recipientCount: 3,
            timestamp: '2025-01-31T10:00:00Z',
          },
        ],
      }),
      recordOperationAudit: jest.fn().mockResolvedValue({ recorded: true }),
    };
  });

  it('teamIdがnullの場合、拠点全体を対象として配置案が生成される', async () => {
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2025-01-01',
      analysisEndDate: '2025-01-31',
      executingUserId: 'USR-123',
      autoApprovalEnabled: true,
    };

    const result = await runTx2Imp2Agent(input, mockAiClient);

    expect(result.status).toBe('success');

    expect(mockAiClient.authorizeOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'USR-123',
        operationType: expect.any(String),
      })
    );

    expect(mockAiClient.validateReferentialIntegrity).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'FAC-001',
        teamId: null,
      })
    );

    expect(mockAiClient.listProductivityDataByCondition).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'FAC-001',
        teamId: null,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      })
    );

    expect(mockAiClient.generateAllocationPlans).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'FAC-001',
        teamId: null,
        scope: 'facility_wide',
      })
    );

    expect(result.generatedAllocationPlans).toBeDefined();
    expect(Array.isArray(result.generatedAllocationPlans)).toBe(true);
    expect(result.generatedAllocationPlans.length).toBeGreaterThan(0);

    result.generatedAllocationPlans.forEach((plan: any) => {
      expect(plan).toHaveProperty('allocationPlanId');
      expect(plan).toHaveProperty('planName');
      expect(plan).toHaveProperty('feasibilityScore');
      expect(plan).toHaveProperty('recommendedRank');
      expect(plan).toHaveProperty('status');
      expect(typeof plan.allocationPlanId).toBe('string');
      expect(typeof plan.planName).toBe('string');
      expect(typeof plan.feasibilityScore).toBe('number');
      expect(typeof plan.recommendedRank).toBe('number');
    });

    expect(mockAiClient.judgeAllocationPlanApprovalWithCriteria).toHaveBeenCalledWith(
      expect.objectContaining({
        autoApprovalEnabled: true,
      })
    );

    expect(result.autoApprovedPlans).toBeDefined();
    expect(Array.isArray(result.autoApprovedPlans)).toBe(true);
    expect(result.autoApprovedPlans.length).toBeGreaterThan(0);

    result.autoApprovedPlans.forEach((approvedPlan: any) => {
      expect(approvedPlan).toHaveProperty('allocationPlanId');
      expect(approvedPlan).toHaveProperty('planName');
      expect(approvedPlan).toHaveProperty('approvalReason');
      expect(approvedPlan).toHaveProperty('deliveryStatus');
    });

    expect(mockAiClient.deliverAllocationPlanAndWorkInstructions).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'FAC-001',
        scope: 'facility_wide',
      })
    );

    expect(result.deliveredInstructionCount).toBeGreaterThanOrEqual(1);
    expect(result.failedDeliveryCount).toBe(0);

    expect(result.analysisMetadata).toBeDefined();
    expect(result.analysisMetadata).toHaveProperty('productivityDataCount');
    expect(result.analysisMetadata).toHaveProperty('workersAnalyzed');
    expect(result.analysisMetadata).toHaveProperty('proficiencyLevelsApplied');
    expect(result.analysisMetadata).toHaveProperty('analysisExecutionTimeMs');
    expect(typeof result.analysisMetadata.productivityDataCount).toBe('number');
    expect(typeof result.analysisMetadata.workersAnalyzed).toBe('number');
    expect(Array.isArray(result.analysisMetadata.proficiencyLevelsApplied)).toBe(true);
    expect(typeof result.analysisMetadata.analysisExecutionTimeMs).toBe('number');

    expect(mockAiClient.recordOperationAudit).toHaveBeenCalled();
  });
});