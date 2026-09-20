import { judgeAllocationPlanApprovalWithCriteria, SystemEvaluationError } from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-316: 承認基準の評価ロジック実行中にエラーが発生したとき、SystemEvaluationErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockAllocationPlan = (id: string, facilityId: string, teamId: string) => ({
    allocationPlanId: id,
    planName: 'Test Plan',
    facilityId: facilityId,
    teamId: teamId,
    workInstructionId: `work-${id}`,
    allocatedWorkerCount: 5,
    plannedStartDate: '2024-01-01T00:00:00Z',
    plannedEndDate: '2024-01-02T00:00:00Z',
    expectedCompletionDate: '2024-01-02T00:00:00Z',
    currentProgressRate: 50,
    delayRiskLevel: 'medium' as const,
    delayRiskScore: 50,
    predictedDelayDays: 1,
    feasibilityScore: 75,
    averageWorkerProductivityRate: 85,
    recommendationReason: 'Test recommendation',
    rankingPriority: 1,
    status: 'pending_review' as const,
  });

  const createMockProgressData = (current: number, planned: number) => ({
    currentProgressRate: current,
    plannedProgressRate: planned,
  });

  const createMockProductivityData = () => ({
    'worker-001': { productivityRate: 85, qualityScore: 90 },
    'worker-002': { productivityRate: 80, qualityScore: 85 },
  });

  const createMockDelayRiskData = (riskLevel: string, delayDays: number) => ({
    riskLevel: riskLevel,
    predictedDelayDays: delayDays,
  });

  it('承認基準評価内部で予期しない例外が発生したとき、正確なエラーメッセージ形式でSystemEvaluationErrorが発生する', async () => {
    const input = {
      userId: 'user-logistics-manager-001',
      allocationPlanId: 'plan-123',
      manualDecision: null as null,
      manualDecisionReason: null,
    };

    const mockAllocationPlan = createMockAllocationPlan('plan-123', 'facility-001', 'team-001');
    const mockProgressData = createMockProgressData(50, 60);
    const mockProductivityData = createMockProductivityData();
    const mockDelayRiskData = createMockDelayRiskData('medium', 1);
    const evaluationError = new Error('Evaluation criteria failed unexpectedly');

    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getAllocationPlanById').mockResolvedValue(mockAllocationPlan);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'authorizeOperation').mockResolvedValue({ authorized: true });
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue(mockDelayRiskData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'validateReferentialIntegrity').mockResolvedValue({ valid: true });
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'evaluateCriteria').mockImplementation(() => {
      throw evaluationError;
    });

    let thrownError: unknown = null;
    try {
      await judgeAllocationPlanApprovalWithCriteria(input);
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(SystemEvaluationError);
    if (thrownError instanceof SystemEvaluationError) {
      expect(thrownError.message).toMatch(/^承認基準の評価に失敗しました: /);
      expect(thrownError.message).toContain('Evaluation criteria failed unexpectedly');
      const matches = thrownError.message.match(/^承認基準の評価に失敗しました: (.+)$/);
      expect(matches).not.toBeNull();
      if (matches) {
        expect(matches[1].length).toBeGreaterThan(0);
      }
    }
  });

  it('承認基準評価結果が不正な形式を返したとき、TypeErrorの詳細を含むSystemEvaluationErrorが発生する', async () => {
    const input = {
      userId: 'user-logistics-manager-002',
      allocationPlanId: 'plan-456',
      manualDecision: null as null,
      manualDecisionReason: null,
    };

    const mockAllocationPlan = createMockAllocationPlan('plan-456', 'facility-002', 'team-002');
    const mockProgressData = createMockProgressData(30, 50);
    const mockProductivityData = createMockProductivityData();
    const mockDelayRiskData = createMockDelayRiskData('high', 2);
    const formatError = new TypeError('Evaluation criteria returned invalid format');

    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getAllocationPlanById').mockResolvedValue(mockAllocationPlan);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'authorizeOperation').mockResolvedValue({ authorized: true });
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue(mockDelayRiskData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'validateReferentialIntegrity').mockResolvedValue({ valid: true });
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'evaluateCriteria').mockImplementation(() => {
      throw formatError;
    });

    let thrownError: unknown = null;
    try {
      await judgeAllocationPlanApprovalWithCriteria(input);
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(SystemEvaluationError);
    if (thrownError instanceof SystemEvaluationError) {
      expect(thrownError.message).toMatch(/^承認基準の評価に失敗しました: /);
      expect(thrownError.message).toContain('invalid format');
      const detailMatch = thrownError.message.match(/^承認基準の評価に失敗しました: (.+)$/);
      expect(detailMatch).not.toBeNull();
      if (detailMatch) {
        expect(detailMatch[1]).toContain('TypeError');
      }
    }
  });

  it('SystemEvaluationError発生時に出力型は返されず、処理は中断される', async () => {
    const input = {
      userId: 'user-logistics-manager-003',
      allocationPlanId: 'plan-789',
      manualDecision: null as null,
      manualDecisionReason: null,
    };

    const mockAllocationPlan = createMockAllocationPlan('plan-789', 'facility-003', 'team-003');
    const mockProgressData = createMockProgressData(20, 40);
    const mockProductivityData = createMockProductivityData();
    const mockDelayRiskData = createMockDelayRiskData('critical', 3);
    const systemError = new Error('Criteria evaluation system error');

    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getAllocationPlanById').mockResolvedValue(mockAllocationPlan);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'authorizeOperation').mockResolvedValue({ authorized: true });
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue(mockDelayRiskData);
    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'validateReferentialIntegrity').mockResolvedValue({ valid: true });

    const updateAllocationPlanSpy = jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'updateAllocationPlanStatus');
    const recordOperationAuditSpy = jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'recordOperationAudit');
    const sendNotificationSpy = jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'sendNotification');

    jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'evaluateCriteria').mockImplementation(() => {
      throw systemError;
    });

    let result: unknown = undefined;
    let thrownError: unknown = null;
    let processContinued = false;

    try {
      result = await judgeAllocationPlanApprovalWithCriteria(input);
      processContinued = true;
    } catch (error: unknown) {
      thrownError = error;
      processContinued = false;
    }

    expect(processContinued).toBe(false);
    expect(result).toBeUndefined();
    expect(thrownError).toBeInstanceOf(SystemEvaluationError);
    if (thrownError instanceof SystemEvaluationError) {
      expect(thrownError.message).toMatch(/^承認基準の評価に失敗しました: /);
      expect(thrownError.message).toContain('system error');
    }
    expect(updateAllocationPlanSpy).not.toHaveBeenCalled();
    expect(recordOperationAuditSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it('複数のエラー条件で一貫してSystemEvaluationErrorが発生する', async () => {
    const testCases = [
      {
        description: '評価関数が範囲外の値を返す',
        error: new RangeError('Score out of range'),
        expectedInMessage: 'Score out of range',
      },
      {
        description: '評価関数がタイムアウト',
        error: new Error('Evaluation timeout after 30s'),
        expectedInMessage: 'timeout',
      },
      {
        description: '評価関数が無効なデータ参照',
        error: new ReferenceError('Cannot read property of null'),
        expectedInMessage: 'null',
      },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();

      const mockAllocationPlan = createMockAllocationPlan('plan-test', 'facility-test', 'team-test');
      const mockProgressData = createMockProgressData(50, 60);
      const mockProductivityData = createMockProductivityData();
      const mockDelayRiskData = createMockDelayRiskData('medium', 1);

      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getAllocationPlanById').mockResolvedValue(mockAllocationPlan);
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'authorizeOperation').mockResolvedValue({ authorized: true });
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentProgressDataByWorkInstruction').mockResolvedValue(mockProgressData);
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getLatestProductivityDataByWorker').mockResolvedValue(mockProductivityData);
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'getRecentDelayRiskJudgmentByFacilityAndTeam').mockResolvedValue(mockDelayRiskData);
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'validateReferentialIntegrity').mockResolvedValue({ valid: true });
      jest.spyOn(require('../../src/logic/allocation-plan-review-approval'), 'evaluateCriteria').mockImplementation(() => {
        throw testCase.error;
      });

      const input = {
        userId: 'user-logistics-manager-test',
        allocationPlanId: 'plan-test',
        manualDecision: null as null,
        manualDecisionReason: null,
      };

      let thrownError: unknown = null;
      try {
        await judgeAllocationPlanApprovalWithCriteria(input);
      } catch (error: unknown) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(SystemEvaluationError);
      if (thrownError instanceof SystemEvaluationError) {
        expect(thrownError.message).toMatch(/^承認基準の評価に失敗しました: /);
        expect(thrownError.message).toContain(testCase.expectedInMessage);
      }
    }
  });
});