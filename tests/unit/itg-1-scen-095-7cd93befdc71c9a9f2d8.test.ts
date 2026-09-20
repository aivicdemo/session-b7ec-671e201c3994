import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import {
  Tx6Imp1AgentInput,
  Tx6Imp1AgentOutput,
  OrderSurgeEvent,
  ErrorDetail,
} from '../../src/agents/tx-6-imp-1/orchestrator';

// Mock dependencies
jest.mock('../../src/agents/tx-6-imp-1/services/authorization');
jest.mock('../../src/agents/tx-6-imp-1/services/progress-data-service');
jest.mock('../../src/agents/tx-6-imp-1/services/productivity-data-service');
jest.mock('../../src/agents/tx-6-imp-1/services/productivity-analysis-service');
jest.mock('../../src/agents/tx-6-imp-1/services/allocation-plan-service');
jest.mock('../../src/agents/tx-6-imp-1/services/approval-service');
jest.mock('../../src/agents/tx-6-imp-1/services/delivery-service');
jest.mock('../../src/agents/tx-6-imp-1/services/audit-service');

import { authorizeOperation } from '../../src/agents/tx-6-imp-1/services/authorization';
import { listProgressDataByCondition } from '../../src/agents/tx-6-imp-1/services/progress-data-service';
import { listProductivityDataByCondition } from '../../src/agents/tx-6-imp-1/services/productivity-data-service';
import { aggregateWorkResultsAndCalculateProductivity } from '../../src/agents/tx-6-imp-1/services/productivity-analysis-service';
import { generateAllocationPlans } from '../../src/agents/tx-6-imp-1/services/allocation-plan-service';
import { judgeAllocationPlanApprovalWithCriteria } from '../../src/agents/tx-6-imp-1/services/approval-service';
import { deliverAllocationPlanAndWorkInstructions } from '../../src/agents/tx-6-imp-1/services/delivery-service';
import { deliverAllocationInstructionToFieldLeader } from '../../src/agents/tx-6-imp-1/services/delivery-service';
import { recordOperationAudit } from '../../src/agents/tx-6-imp-1/services/audit-service';

describe('SCEN-095: 生産性データ分析エラー時の処理中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('生産性データの分析処理でProductivityDataAnalysisFailureエラーが発生した場合、executionStatusがfailureになり、配置案生成以降の処理が実行されないこと', async () => {
    // Arrange: テスト用の入力値を構築
    const userId = 'user-001';
    const orderSurgeEvent: OrderSurgeEvent = {
      eventId: 'event-surge-001',
      facilityId: 'fac-100',
      detectionTimestamp: new Date().toISOString(),
      surgeQuantity: 500,
      surgePercentage: 150,
    };
    const targetFacilityIds = ['fac-100', 'fac-101', 'fac-102'];
    const analysisTimeWindowMinutes = 60;
    const autoApprovalThreshold = 80;

    const input: Tx6Imp1AgentInput = {
      userId,
      orderSurgeEvent,
      targetFacilityIds,
      analysisTimeWindowMinutes,
      autoApprovalThreshold,
    };

    // Arrange: 権限検証をモック化し、成功するよう設定
    (authorizeOperation as jest.Mock).mockResolvedValue({ authorized: true });

    // Arrange: 進捗データをモック化し、複数チームのデータを返すよう設定
    (listProgressDataByCondition as jest.Mock).mockResolvedValue([
      {
        progressDataId: 'prog-001',
        facilityId: 'fac-100',
        teamId: 'team-001',
        progressRate: 60,
        delayFlag: true,
        delayDays: 2,
      },
      {
        progressDataId: 'prog-002',
        facilityId: 'fac-101',
        teamId: 'team-002',
        progressRate: 55,
        delayFlag: true,
        delayDays: 3,
      },
      {
        progressDataId: 'prog-003',
        facilityId: 'fac-102',
        teamId: 'team-003',
        progressRate: 70,
        delayFlag: false,
        delayDays: 0,
      },
    ]);

    // Arrange: 生産性データをモック化し、分析対象期間のデータを返すよう設定
    (listProductivityDataByCondition as jest.Mock).mockResolvedValue([
      {
        productivityDataId: 'prod-001',
        workerId: 'worker-001',
        productivityRate: 85,
        qualityScore: 90,
      },
      {
        productivityDataId: 'prod-002',
        workerId: 'worker-002',
        productivityRate: 75,
        qualityScore: 80,
      },
    ]);

    // Arrange: 生産性データ分析処理をモック化し、意図的にエラーをスロー
    const productivityAnalysisError = new Error('ProductivityDataAnalysisFailure');
    (aggregateWorkResultsAndCalculateProductivity as jest.Mock).mockRejectedValue(
      productivityAnalysisError
    );

    // Arrange: 操作監査ログをモック化
    (recordOperationAudit as jest.Mock).mockResolvedValue({ recorded: true });

    // Act: runTx6Imp1Agent関数を実行
    const result: Tx6Imp1AgentOutput = await runTx6Imp1Agent(userId, input);

    // Assert: executionStatusがfailureであることを確認
    expect(result.executionStatus).toBe('failure');

    // Assert: orderSurgeEventIdが設定されていることを確認
    expect(result.orderSurgeEventId).toBe(orderSurgeEvent.eventId);

    // Assert: analysisResult、generatedAllocationPlans、approvalResult、deliveryResultがnullまたは未設定であることを確認
    expect(result.analysisResult).toBeNull();
    expect(result.generatedAllocationPlans == null || result.generatedAllocationPlans.length === 0).toBe(true);
    expect(result.approvalResult).toBeNull();
    expect(result.deliveryResult).toBeNull();

    // Assert: errorDetailsに適切なエラー情報が含まれていることを確認
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toHaveLength(1);
    expect(result.errorDetails![0].errorName).toBe('ProductivityDataAnalysisFailure');
    expect(result.errorDetails![0].errorMessage).toBe(
      '生産性データの分析に失敗しました。データの整合性を確認してください。'
    );

    // Assert: executionTimestampがISO 8601形式で設定されていることを確認
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Assert: 生産性データ分析処理が呼ばれたことを確認
    expect(aggregateWorkResultsAndCalculateProductivity).toHaveBeenCalled();

    // Assert: 最適人員配置案の生成が呼ばれていないことを確認
    expect(generateAllocationPlans).not.toHaveBeenCalled();

    // Assert: 承認判定が呼ばれていないことを確認
    expect(judgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();

    // Assert: 配置指示配信が呼ばれていないことを確認
    expect(deliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

    // Assert: 現場リーダーへの配置指示配信が呼ばれていないことを確認
    expect(deliverAllocationInstructionToFieldLeader).not.toHaveBeenCalled();

    // Assert: 操作監査ログが記録されたことを確認
    expect(recordOperationAudit).toHaveBeenCalled();

    // Assert: AllocationPlanApprovalFailureエラーが発生していないことを確認
    const hasApprovalFailure = result.errorDetails?.some(
      (error) =>
        error.errorName === 'AllocationPlanApprovalFailure' &&
        error.errorMessage.includes('人員配置案が承認基準を満たしません')
    );
    expect(hasApprovalFailure).toBeFalsy();
  });
});