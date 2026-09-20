import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { Tx5Imp1AgentInput, Tx5Imp1AgentOutput } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('SCEN-081: 作業者の過去実績データが最小必要件数に満たない場合のエラー処理', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockGetWorkerById: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetLatestProficiencyByWorkerAndJobType: jest.Mock;
  let mockListWorkInstructionsByCondition: jest.Mock;
  let mockGenerateAllocationPlans: jest.Mock;
  let mockExtractAndRankAllocationPlansForReview: jest.Mock;
  let mockSaveAllocationPlan: jest.Mock;
  let mockDeliverAllocationInstructionToFieldLeader: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockGetWorkerById = jest.fn().mockResolvedValue({
      作業者ID: 'WORKER-NEW-001',
      作業者名: '新規配属者',
      拠点ID: 'BASE-001',
      チームID: 'TEAM-001',
      職種: '一般作業者',
      稼働状況: '稼働中',
    });
    mockGetLatestProductivityDataByWorker = jest.fn().mockResolvedValue([
      {
        生産性データID: 'PROD-001',
        作業者ID: 'WORKER-NEW-001',
        作業日: '2025-01-01T09:00:00Z',
        生産性率: 75,
        品質スコア: 80,
      },
      {
        生産性データID: 'PROD-002',
        作業者ID: 'WORKER-NEW-001',
        作業日: '2025-01-02T09:00:00Z',
        生産性率: 78,
        品質スコア: 82,
      },
      {
        生産性データID: 'PROD-003',
        作業者ID: 'WORKER-NEW-001',
        作業日: '2025-01-03T09:00:00Z',
        生産性率: 76,
        品質スコア: 81,
      },
      {
        生産性データID: 'PROD-004',
        作業者ID: 'WORKER-NEW-001',
        作業日: '2025-01-04T09:00:00Z',
        生産性率: 77,
        品質スコア: 79,
      },
    ]);
    mockGetLatestProficiencyByWorkerAndJobType = jest.fn();
    mockListWorkInstructionsByCondition = jest.fn();
    mockGenerateAllocationPlans = jest.fn();
    mockExtractAndRankAllocationPlansForReview = jest.fn();
    mockSaveAllocationPlan = jest.fn();
    mockDeliverAllocationInstructionToFieldLeader = jest.fn();
    mockRecordOperationAudit = jest.fn();
  });

  it('過去実績件数が4件（最小必要件数5件未満）の場合、InsufficientProductivityHistoryErrorを発生させる', async () => {
    const workerId = 'WORKER-NEW-001';
    const executingUserId = 'USER-ADMIN-001';
    const analysisLookbackDays = 30;
    const minimumProductivityRecordsRequired = 5;

    const input: Tx5Imp1AgentInput = {
      workerId,
      executingUserId,
      analysisLookbackDays,
      minimumProductivityRecordsRequired,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    let result: Tx5Imp1AgentOutput | undefined;
    let thrownError: Error | undefined;

    try {
      result = await runTx5Imp1Agent(input, aiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    // 実装がエラーをスローするか、返却するかのいずれかに対応
    if (thrownError) {
      // エラーがスローされた場合
      expect(thrownError.name).toBe('InsufficientProductivityHistoryError');
      expect(thrownError.message).toBe(
        '作業者の過去実績データが不足しています。分析に必要な最小件数に達していません。'
      );
    } else if (result) {
      // エラーが返却値に含まれた場合
      expect(result.success).toBe(false);
      expect(result.workerId).toBe(workerId);
      expect(result.generatedAllocationPlanIds).toEqual([]);
      
      // productivityPatternSummary, proficiencyLevelByJobType, recommendedDifficultyAdjustment
      // は null またはデフォルト値のいずれかを許容
      if (result.productivityPatternSummary !== null) {
        expect(result.productivityPatternSummary).toBeDefined();
      }
      if (result.proficiencyLevelByJobType !== null) {
        expect(result.proficiencyLevelByJobType).toBeDefined();
      }
      if (result.recommendedDifficultyAdjustment !== null) {
        expect(result.recommendedDifficultyAdjustment).toBeDefined();
      }
      
      expect(result.approvalNotificationSent).toBe(false);
      expect(result.approvalNotificationRecipients).toEqual([]);
      expect(result.errorDetails).not.toBeNull();
      if (result.errorDetails) {
        expect(result.errorDetails.name).toBe('InsufficientProductivityHistoryError');
        expect(result.errorDetails.message).toBe(
          '作業者の過去実績データが不足しています。分析に必要な最小件数に達していません。'
        );
      }
      expect(result.executionTimestamp).toBeTruthy();
      expect(result.executionTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/
      );
    } else {
      fail('runTx5Imp1Agent は error をスローするか、出力値を返却する必要があります');
    }

    // 他の呼び出しが実行されていないことを確認
    expect(mockGetLatestProficiencyByWorkerAndJobType).not.toHaveBeenCalled();
    expect(mockListWorkInstructionsByCondition).not.toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).not.toHaveBeenCalled();
    expect(mockExtractAndRankAllocationPlansForReview).not.toHaveBeenCalled();
    expect(mockSaveAllocationPlan).not.toHaveBeenCalled();
    expect(mockDeliverAllocationInstructionToFieldLeader).not.toHaveBeenCalled();
    expect(mockRecordOperationAudit).not.toHaveBeenCalled();
  });

  it('success が false、errorDetails に詳細情報が格納される', async () => {
    const workerId = 'WORKER-NEW-001';
    const executingUserId = 'USER-ADMIN-001';
    const analysisLookbackDays = 30;
    const minimumProductivityRecordsRequired = 5;

    const input: Tx5Imp1AgentInput = {
      workerId,
      executingUserId,
      analysisLookbackDays,
      minimumProductivityRecordsRequired,
    };

    const aiClient = {
      authorizeOperation: mockAuthorizeOperation,
      getWorkerById: mockGetWorkerById,
      getLatestProductivityDataByWorker: mockGetLatestProductivityDataByWorker,
      getLatestProficiencyByWorkerAndJobType: mockGetLatestProficiencyByWorkerAndJobType,
      listWorkInstructionsByCondition: mockListWorkInstructionsByCondition,
      generateAllocationPlans: mockGenerateAllocationPlans,
      extractAndRankAllocationPlansForReview: mockExtractAndRankAllocationPlansForReview,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
      recordOperationAudit: mockRecordOperationAudit,
    };

    let result: Tx5Imp1AgentOutput | undefined;
    let thrownError: Error | undefined;

    try {
      result = await runTx5Imp1Agent(input, aiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    if (thrownError) {
      // エラーがスローされた場合
      expect(thrownError.name).toBe('InsufficientProductivityHistoryError');
      expect(thrownError.message).toBe(
        '作業者の過去実績データが不足しています。分析に必要な最小件数に達していません。'
      );
    } else if (result) {
      // エラーが返却値に含まれた場合
      expect(result.success).toBe(false);
      expect(result.workerId).toBe(workerId);
      expect(result.errorDetails).toBeDefined();
      expect(result.errorDetails).not.toBeNull();
      if (result.errorDetails) {
        expect(result.errorDetails.name).toBe('InsufficientProductivityHistoryError');
        expect(result.errorDetails.message).toBe(
          '作業者の過去実績データが不足しています。分析に必要な最小件数に達していません。'
        );
      }
      expect(result.executionTimestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/
      );
    } else {
      fail('runTx5Imp1Agent は error をスローするか、出力値を返却する必要があります');
    }
  });
});