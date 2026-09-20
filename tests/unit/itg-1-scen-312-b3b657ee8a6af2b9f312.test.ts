import {
  judgeAllocationPlanApprovalWithCriteria,
  JudgeAllocationPlanApprovalWithCriteriaInput,
} from "../../src/logic/allocation-plan-review-approval";
import * as allocationPlanModule from "../../src/logic/allocation-plan-review-approval";

jest.mock("../../src/logic/allocation-plan-review-approval", () => {
  const actual = jest.requireActual(
    "../../src/logic/allocation-plan-review-approval"
  );
  return {
    ...actual,
    getAllocationPlanById: jest.fn(),
    authorizeOperation: jest.fn(),
    validateReferentialIntegrity: jest.fn(),
    getApprovalCriteriaByFacilityId: jest.fn(),
  };
});

describe("SCEN-312: ApprovalCriteriaNotConfiguredError when approval criteria not set", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ApprovalCriteriaNotConfiguredError when approval criteria is not configured for the facility", async () => {
    const userId = "user-center-director-001";
    const allocationPlanId = "plan-001";
    const facilityId = "facility-001";

    const mockAllocationPlan = {
      allocationPlanId,
      planName: "Test Plan",
      facilityId,
      teamId: "team-001",
      workInstructionId: "work-001",
      allocatedWorkerCount: 5,
      plannedStartDate: "2024-01-15T09:00:00Z",
      plannedEndDate: "2024-01-15T17:00:00Z",
      expectedCompletionDate: "2024-01-15T16:00:00Z",
      currentProgressRate: 50,
      delayRiskLevel: "medium" as const,
      delayRiskScore: 45,
      predictedDelayDays: 1,
      feasibilityScore: 75,
      averageWorkerProductivityRate: 80,
      recommendationReason: "Test recommendation",
      rankingPriority: 1,
      status: "pending_review" as const,
    };

    (allocationPlanModule.getAllocationPlanById as jest.Mock).mockResolvedValue(
      mockAllocationPlan
    );

    (allocationPlanModule.authorizeOperation as jest.Mock).mockResolvedValue(
      true
    );

    (
      allocationPlanModule.validateReferentialIntegrity as jest.Mock
    ).mockResolvedValue(true);

    (
      allocationPlanModule.getApprovalCriteriaByFacilityId as jest.Mock
    ).mockResolvedValue(undefined);

    const input: JudgeAllocationPlanApprovalWithCriteriaInput = {
      userId,
      allocationPlanId,
      manualDecision: null,
      manualDecisionReason: null,
    };

    let caughtError: Error | null = null;

    try {
      await judgeAllocationPlanApprovalWithCriteria(input);
    } catch (err: unknown) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error & { name?: string }).name).toBe(
      "ApprovalCriteriaNotConfiguredError"
    );

    const expectedMessage = `承認基準が設定されていません: 拠点ID=${facilityId}`;
    expect(caughtError?.message).toBe(expectedMessage);

    const errorAsAny = caughtError as Record<string, unknown>;
    expect(errorAsAny.allocationPlanId).toBeUndefined();
    expect(errorAsAny.approvalStatus).toBeUndefined();
    expect(errorAsAny.approvalDecisionType).toBeUndefined();
    expect(errorAsAny.judgedAt).toBeUndefined();
    expect(errorAsAny.judgedBy).toBeUndefined();
    expect(errorAsAny.criteriaEvaluationResult).toBeUndefined();
  });
});