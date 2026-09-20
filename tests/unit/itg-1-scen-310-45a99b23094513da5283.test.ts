import { judgeAllocationPlanApprovalWithCriteria } from '../../src/logic/allocation-plan-review-approval';

// Mock only the external dependencies, not the function under test
jest.mock('../../src/data/repositories/allocation-plan-repository');
jest.mock('../../src/data/repositories/progress-data-repository');
jest.mock('../../src/data/repositories/productivity-data-repository');
jest.mock('../../src/data/repositories/delay-risk-repository');
jest.mock('../../src/services/authorization-service');
jest.mock('../../src/services/validation-service');
jest.mock('../../src/services/audit-service');

describe('SCEN-310: 手動判定がnullで基準内の配置案について、自動承認し承認基準の評価結果を返す', () => {
  const testUserId = 'U001';
  const testAllocationPlanId = 'AP001';
  const testFacilityId = 'FAC001';
  const testTeamId = 'TEAM001';
  const testWorkInstructionId = 'WI001';

  let mockGetAllocationPlanById: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockGetRecentProgressDataByWorkInstruction: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mock functions
    mockGetAllocationPlanById = require('../../src/data/repositories/allocation-plan-repository').getAllocationPlanById;
    mockSaveAllocationPlan = require('../../src/data/repositories/allocation-plan-repository').saveAllocationPlan;
    mockGetRecentProgressDataByWorkInstruction = require('../../src/data/repositories/progress-data-repository').getRecentProgressDataByWorkInstruction;
    mockGetLatestProductivityDataByWorker = require('../../src/data/repositories/productivity-data-repository').getLatestProductivityDataByWorker;
    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = require('../../src/data/repositories/delay-risk-repository').getRecentDelayRiskJudgmentByFacilityAndTeam;
    mockAuthorizeOperation = require('../../src/services/authorization-service').authorizeOperation;
    mockValidateReferentialIntegrity = require('../../src/services/validation-service').validateReferentialIntegrity;
    mockRecordOperationAudit = require('../../src/services/audit-service').recordOperationAudit;

    // Setup default mock implementations
    const now = new Date().toISOString();

    mockGetAllocationPlanById.mockResolvedValue({
      allocationPlanId: testAllocationPlanId,
      planName: 'Test Plan',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocatedWorkerCount: 5,
      plannedStartDate: now,
      plannedEndDate: new Date(Date.now() + 86400000).toISOString(),
      expectedCompletionDate: new Date(Date.now() + 172800000).toISOString(),
      currentProgressRate: 85,
      delayRiskLevel: 'low',
      delayRiskScore: 15,
      predictedDelayDays: 0,
      feasibilityScore: 85,
      averageWorkerProductivityRate: 90,
      recommendationReason: 'Optimal allocation for team',
      rankingPriority: 1,
      status: 'pending_review',
    });

    mockGetRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: testWorkInstructionId,
      currentProgressRate: 85,
      plannedProgressRate: 80,
    });

    mockGetLatestProductivityDataByWorker.mockResolvedValue({
      W001: { productivityRate: 92, qualityScore: 88 },
      W002: { productivityRate: 88, qualityScore: 90 },
      W003: { productivityRate: 85, qualityScore: 92 },
      W004: { productivityRate: 90, qualityScore: 87 },
      W005: { productivityRate: 89, qualityScore: 89 },
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam.mockResolvedValue({
      riskLevel: 'low',
      predictedDelayDays: 0,
    });

    mockAuthorizeOperation.mockResolvedValue(undefined);
    mockValidateReferentialIntegrity.mockResolvedValue(undefined);
    mockSaveAllocationPlan.mockResolvedValue(undefined);
    mockRecordOperationAudit.mockResolvedValue(undefined);
  });

  it('基準内の配置案をnullの手動判定で自動承認し、評価結果を返すこと', async () => {
    const input = {
      userId: testUserId,
      allocationPlanId: testAllocationPlanId,
      manualDecision: null as const,
      manualDecisionReason: null,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    // Verify basic output fields
    expect(result.allocationPlanId).toBe(testAllocationPlanId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.approvalDecisionType).toBe('auto_approved');
    expect(result.judgedBy).toBe(testUserId);

    // Verify judgedAt is ISO 8601 format
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
    expect(result.judgedAt).toMatch(iso8601Regex);

    // Verify criteria evaluation result exists and all criteria passed
    expect(result.criteriaEvaluationResult).toBeDefined();
    expect(result.criteriaEvaluationResult.overallPassed).toBe(true);

    // Verify all criteria thresholds
    expect(result.criteriaEvaluationResult.progressRateThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.progressRateThreshold.passed).toBe(true);
    expect(result.criteriaEvaluationResult.progressRateThreshold.threshold).toBeGreaterThan(0);
    expect(result.criteriaEvaluationResult.progressRateThreshold.actualValue).toBeGreaterThanOrEqual(
      result.criteriaEvaluationResult.progressRateThreshold.threshold
    );

    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold.passed).toBe(true);

    expect(result.criteriaEvaluationResult.productivityScoreThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.passed).toBe(true);
    expect(result.criteriaEvaluationResult.productivityScoreThreshold.actualValue).toBeGreaterThanOrEqual(
      result.criteriaEvaluationResult.productivityScoreThreshold.threshold
    );

    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.passed).toBe(true);
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold.actualValue).toBeGreaterThanOrEqual(
      result.criteriaEvaluationResult.feasibilityScoreThreshold.threshold
    );

    expect(result.criteriaEvaluationResult.allocationCapacityThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.allocationCapacityThreshold.passed).toBe(true);

    // Verify approval reason contains criteria evaluation details
    expect(result.approvalReason).toBeDefined();
    expect(typeof result.approvalReason).toBe('string');
    expect(result.approvalReason.length).toBeGreaterThan(0);

    // Verify approval reason includes evaluation details
    expect(result.approvalReason).toContain('progressRate');
    expect(result.approvalReason).toContain('delayRiskLevel');
    expect(result.approvalReason).toContain('productivityScore');
    expect(result.approvalReason).toContain('feasibilityScore');
    expect(result.approvalReason).toContain('allocationCapacity');

    // Verify all required dependencies were called
    expect(mockGetAllocationPlanById).toHaveBeenCalledWith(testAllocationPlanId);
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(testUserId, expect.any(String));
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
    expect(mockGetRecentProgressDataByWorkInstruction).toHaveBeenCalledWith(testWorkInstructionId);
    expect(mockGetLatestProductivityDataByWorker).toHaveBeenCalled();
    expect(mockGetRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockRecordOperationAudit).toHaveBeenCalled();
  });

  it('judgedAtがテスト実行時刻の範囲内であること', async () => {
    const beforeTime = new Date();

    const input = {
      userId: testUserId,
      allocationPlanId: testAllocationPlanId,
      manualDecision: null as const,
      manualDecisionReason: null,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    const afterTime = new Date();
    const judgedTime = new Date(result.judgedAt);

    expect(judgedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(judgedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
  });

  it('すべての基準項目が記録されていること', async () => {
    const input = {
      userId: testUserId,
      allocationPlanId: testAllocationPlanId,
      manualDecision: null as const,
      manualDecisionReason: null,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    // Verify all evaluation result fields are present
    const criteriaEval = result.criteriaEvaluationResult;

    expect(criteriaEval.progressRateThreshold).toBeDefined();
    expect(criteriaEval.progressRateThreshold.threshold).toBeDefined();
    expect(criteriaEval.progressRateThreshold.actualValue).toBeDefined();
    expect(criteriaEval.progressRateThreshold.passed).toBeDefined();

    expect(criteriaEval.delayRiskLevelThreshold).toBeDefined();
    expect(criteriaEval.delayRiskLevelThreshold.threshold).toBeDefined();
    expect(criteriaEval.delayRiskLevelThreshold.actualValue).toBeDefined();
    expect(criteriaEval.delayRiskLevelThreshold.passed).toBeDefined();

    expect(criteriaEval.productivityScoreThreshold).toBeDefined();
    expect(criteriaEval.productivityScoreThreshold.threshold).toBeDefined();
    expect(criteriaEval.productivityScoreThreshold.actualValue).toBeDefined();
    expect(criteriaEval.productivityScoreThreshold.passed).toBeDefined();

    expect(criteriaEval.feasibilityScoreThreshold).toBeDefined();
    expect(criteriaEval.feasibilityScoreThreshold.threshold).toBeDefined();
    expect(criteriaEval.feasibilityScoreThreshold.actualValue).toBeDefined();
    expect(criteriaEval.feasibilityScoreThreshold.passed).toBeDefined();

    expect(criteriaEval.allocationCapacityThreshold).toBeDefined();
    expect(criteriaEval.allocationCapacityThreshold.threshold).toBeDefined();
    expect(criteriaEval.allocationCapacityThreshold.actualValue).toBeDefined();
    expect(criteriaEval.allocationCapacityThreshold.passed).toBeDefined();

    expect(criteriaEval.overallPassed).toBeDefined();
    expect(typeof criteriaEval.overallPassed).toBe('boolean');
  });
});