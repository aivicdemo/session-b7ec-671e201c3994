import { jest } from '@jest/globals';
import {
  judgeAllocationPlanApprovalWithCriteria,
  JudgeAllocationPlanApprovalWithCriteriaInput,
  JudgeAllocationPlanApprovalWithCriteriaOutput,
} from '../../src/logic/allocation-plan-review-approval';

// Mock the dependencies
jest.mock('../../src/infrastructure/authorization', () => ({
  authorizeOperation: jest.fn(),
}));

jest.mock('../../src/infrastructure/allocation-plan-repository', () => ({
  getAllocationPlanById: jest.fn(),
  saveAllocationPlan: jest.fn(),
}));

jest.mock('../../src/infrastructure/progress-data-repository', () => ({
  getRecentProgressDataByWorkInstruction: jest.fn(),
}));

jest.mock('../../src/infrastructure/productivity-data-repository', () => ({
  getLatestProductivityDataByWorker: jest.fn(),
}));

jest.mock('../../src/infrastructure/risk-judgment-repository', () => ({
  getRecentDelayRiskJudgmentByFacilityAndTeam: jest.fn(),
}));

jest.mock('../../src/infrastructure/data-integrity', () => ({
  validateReferentialIntegrity: jest.fn(),
}));

jest.mock('../../src/infrastructure/audit-logger', () => ({
  recordOperationAudit: jest.fn(),
}));

import * as authModule from '../../src/infrastructure/authorization';
import * as planModule from '../../src/infrastructure/allocation-plan-repository';
import * as progressModule from '../../src/infrastructure/progress-data-repository';
import * as productivityModule from '../../src/infrastructure/productivity-data-repository';
import * as riskModule from '../../src/infrastructure/risk-judgment-repository';
import * as integrityModule from '../../src/infrastructure/data-integrity';
import * as auditModule from '../../src/infrastructure/audit-logger';

describe('SCEN-318: 手動判定がrejectのとき、手動却下され判定理由にはユーザーコメントが含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup authorizeOperation mock
    (authModule.authorizeOperation as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    // Setup getAllocationPlanById mock
    (planModule.getAllocationPlanById as jest.Mock).mockResolvedValue({
      allocationPlanId: 'PLAN-001',
      planName: 'Test Plan',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WORK-001',
      allocatedWorkerCount: 5,
      plannedStartDate: '2024-01-01T08:00:00Z',
      plannedEndDate: '2024-01-01T17:00:00Z',
      expectedCompletionDate: '2024-01-02T17:00:00Z',
      currentProgressRate: 45,
      delayRiskLevel: 'medium',
      delayRiskScore: 55,
      predictedDelayDays: 1,
      feasibilityScore: 75,
      averageWorkerProductivityRate: 80,
      recommendationReason: 'Optimal allocation based on current metrics',
      rankingPriority: 1,
      status: 'pending_review',
    });

    // Setup progress data mock
    (progressModule.getRecentProgressDataByWorkInstruction as jest.Mock).mockResolvedValue({
      workInstructionId: 'WORK-001',
      currentProgressRate: 45,
      plannedProgressRate: 60,
      lastUpdated: new Date(Date.now() - 3600000).toISOString(),
    });

    // Setup productivity data mock
    (productivityModule.getLatestProductivityDataByWorker as jest.Mock).mockResolvedValue([
      {
        workerId: 'WORKER-001',
        productivityRate: 85,
        qualityScore: 90,
        lastUpdated: new Date(Date.now() - 1800000).toISOString(),
      },
    ]);

    // Setup risk judgment mock
    (riskModule.getRecentDelayRiskJudgmentByFacilityAndTeam as jest.Mock).mockResolvedValue({
      riskLevel: 'medium',
      predictedDelayDays: 1,
      lastJudgedAt: new Date(Date.now() - 7200000).toISOString(),
    });

    // Setup validation mock
    (integrityModule.validateReferentialIntegrity as jest.Mock).mockResolvedValue({
      valid: true,
    });

    // Setup audit logging mock
    (auditModule.recordOperationAudit as jest.Mock).mockResolvedValue({
      recorded: true,
    });

    // Setup saveAllocationPlan mock
    (planModule.saveAllocationPlan as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('手動判定がrejectのとき、approvalStatusがrejectedで返される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalStatus).toBe('rejected');
  });

  it('手動判定がrejectのとき、approvalDecisionTypeがmanual_rejectedで返される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalDecisionType).toBe('manual_rejected');
  });

  it('approvalReasonにユーザーコメントがそのまま含まれる', async () => {
    const userComment = '人員が不足しているため、隣接拠点からの応援が必要です';
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: userComment,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalReason).toBe(userComment);
  });

  it('allocationPlanIdが正しく返される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.allocationPlanId).toBe('PLAN-001');
  });

  it('judgedByがユーザーIDで返される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.judgedBy).toBe('USER-CENTER-001');
  });

  it('judgedAtがISO 8601形式の日時で返される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.judgedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(result.judgedAt)).not.toThrow();
  });

  it('criteriaEvaluationResultが存在し、各基準項目の評価結果を含む', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.criteriaEvaluationResult).toBeDefined();
    expect(result.criteriaEvaluationResult.progressRateThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.delayRiskLevelThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.productivityScoreThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.feasibilityScoreThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.allocationCapacityThreshold).toBeDefined();
    expect(result.criteriaEvaluationResult.overallPassed).toBeDefined();
  });

  it('手動判定resultがmanual_rejectedの場合、approvalReasonが理由として記録される', async () => {
    const userComment = '人員が不足しているため、隣接拠点からの応援が必要です';
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: userComment,
    };

    const result = await judgeAllocationPlanApprovalWithCriteria(input);

    expect(result.approvalDecisionType).toBe('manual_rejected');
    expect(result.approvalReason).toBe(userComment);
  });

  it('authorizeOperationが呼び出されてユーザー権限が検証される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(authModule.authorizeOperation).toHaveBeenCalled();
  });

  it('getAllocationPlanByIdが呼び出されて配置案が取得される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(planModule.getAllocationPlanById).toHaveBeenCalledWith('PLAN-001');
  });

  it('getRecentProgressDataByWorkInstructionが呼び出される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(progressModule.getRecentProgressDataByWorkInstruction).toHaveBeenCalled();
  });

  it('getLatestProductivityDataByWorkerが呼び出される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(productivityModule.getLatestProductivityDataByWorker).toHaveBeenCalled();
  });

  it('getRecentDelayRiskJudgmentByFacilityAndTeamが呼び出される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(riskModule.getRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalled();
  });

  it('validateReferentialIntegrityが呼び出される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(integrityModule.validateReferentialIntegrity).toHaveBeenCalled();
  });

  it('saveAllocationPlanが呼び出されて配置案が保存される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(planModule.saveAllocationPlan).toHaveBeenCalled();
    const saveCall = (planModule.saveAllocationPlan as jest.Mock).mock.calls[0][0];
    expect(saveCall.allocationPlanId).toBe('PLAN-001');
    expect(saveCall.status).toBe('rejected');
    expect(saveCall.approvalDecisionType).toBe('manual_rejected');
    expect(saveCall.approvalReason).toBe('人員が不足しているため、隣接拠点からの応援が必要です');
  });

  it('recordOperationAuditが呼び出されて操作が記録される', async () => {
    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId: 'USER-CENTER-001',
      allocationPlanId: 'PLAN-001',
      manualDecision: 'reject',
      manualDecisionReason: '人員が不足しているため、隣接拠点からの応援が必要です',
    };

    await judgeAllocationPlanApprovalWithCriteria(input);

    expect(auditModule.recordOperationAudit).toHaveBeenCalled();
    const auditCall = (auditModule.recordOperationAudit as jest.Mock).mock.calls[0][0];
    expect(auditCall.operationType).toBe('allocation_plan_manual_rejection');
  });
});