import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';
import { Tx2Imp2AgentInput, Tx2Imp2AgentOutput } from '../../src/agents/tx-2-imp-2/orchestrator';

describe('SCEN-034: 配置指示の配信に失敗した場合、failedDeliveryCountが0より大きい値で返される', () => {
  it('should return partial_success status with failedDeliveryCount=1 when work instruction delivery partially fails', async () => {
    // Arrange
    const mockProductivityData = [
      {
        生産性データID: 'PROD001',
        作業者ID: 'WORKER001',
        拠点ID: 'FAC001',
        チームID: 'TEAM001',
        作業日: new Date('2024-01-15'),
        計画作業時間: 480,
        実績作業時間: 450,
        完了件数: 95,
        生産性率: 95,
        品質スコア: 92,
        エラー件数: 2,
        習熟度レベル: 'Level3',
        備考: 'Normal work',
        作成日時: new Date('2024-01-15'),
        更新日時: new Date('2024-01-15'),
        作成者: 'USR001',
      },
      {
        生産性データID: 'PROD002',
        作業者ID: 'WORKER002',
        拠点ID: 'FAC001',
        チームID: 'TEAM001',
        作業日: new Date('2024-01-16'),
        計画作業時間: 480,
        実績作業時間: 420,
        完了件数: 85,
        生産性率: 87,
        品質スコア: 88,
        エラー件数: 3,
        習熟度レベル: 'Level2',
        備考: 'Below average',
        作成日時: new Date('2024-01-16'),
        更新日時: new Date('2024-01-16'),
        作成者: 'USR001',
      },
    ];

    const mockAllocationPlan = {
      allocationPlanId: 'ALLOC001',
      planName: 'Optimal Allocation Plan A',
      feasibilityScore: 92,
      recommendedRank: 1,
      status: 'generated',
    };

    const mockDeliveryResult = {
      successful: [
        {
          workInstructionId: 'WI001',
          deliveryId: 'DEL001',
          timestamp: new Date(),
        },
        {
          workInstructionId: 'WI002',
          deliveryId: 'DEL002',
          timestamp: new Date(),
        },
      ],
      failed: [
        {
          workInstructionId: 'WI003',
          errorCode: 'DELIVERY_TIMEOUT',
          errorMessage: '配置指示の配信に失敗しました。手動配信を実施してください。',
        },
      ],
    };

    // Mock external dependencies
    const mockListProductivityData = jest
      .fn()
      .mockResolvedValue(mockProductivityData);

    const mockGenerateAllocationPlans = jest
      .fn()
      .mockResolvedValue([mockAllocationPlan]);

    const mockJudgeApprovalCriteria = jest
      .fn()
      .mockResolvedValue({ approved: true, reason: 'Within approval criteria' });

    const mockSaveAllocationPlan = jest
      .fn()
      .mockResolvedValue({ allocationPlanId: 'ALLOC001' });

    const mockDeliverAllocationPlan = jest
      .fn()
      .mockResolvedValue(mockDeliveryResult);

    const mockAuthorizeOperation = jest
      .fn()
      .mockResolvedValue({ authorized: true });

    const mockAnalysisMetadata = {
      productivityDataCount: 2,
      workersAnalyzed: 2,
      proficiencyLevelsApplied: ['Level2', 'Level3'],
      analysisExecutionTimeMs: 1250,
    };

    // Create mock AI client
    const mockAiClient = {
      listProductivityDataByCondition: mockListProductivityData,
      generateAllocationPlans: mockGenerateAllocationPlans,
      judgeAllocationPlanApprovalWithCriteria: mockJudgeApprovalCriteria,
      saveAllocationPlan: mockSaveAllocationPlan,
      deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlan,
      authorizeOperation: mockAuthorizeOperation,
    };

    const input: Tx2Imp2AgentInput = {
      facilityId: 'FAC001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USR001',
      autoApprovalEnabled: true,
    };

    // Act
    const result: Tx2Imp2AgentOutput = await runTx2Imp2Agent(input, mockAiClient as any);

    // Assert
    expect(result.failedDeliveryCount).toBe(1);
    expect(result.deliveredInstructionCount).toBe(2);
    expect(result.status).toBe('partial_success');

    if (result.autoApprovedPlans && result.autoApprovedPlans.length > 0) {
      const approvedPlan = result.autoApprovedPlans[0];
      expect(approvedPlan.deliveryStatus).toMatch(
        /partial_delivery_failure|delivery_partial_failure/i
      );
    }

    if (result.errorDetails) {
      expect(result.errorDetails.length).toBeGreaterThan(0);
      const deliveryError = result.errorDetails.find(
        (err) =>
          err.errorCode === 'DELIVERY_TIMEOUT' ||
          err.errorMessage.includes('配置指示の配信に失敗')
      );
      expect(deliveryError).toBeDefined();
      if (deliveryError) {
        expect(deliveryError.errorMessage).toContain('配置指示の配信に失敗しました');
        expect(deliveryError.affectedResourceId).toBeDefined();
      }
    }

    // Verify mock calls
    expect(mockAuthorizeOperation).toHaveBeenCalledWith('USR001', expect.any(String));
    expect(mockListProductivityData).toHaveBeenCalled();
    expect(mockGenerateAllocationPlans).toHaveBeenCalled();
    expect(mockJudgeApprovalCriteria).toHaveBeenCalled();
    expect(mockSaveAllocationPlan).toHaveBeenCalled();
    expect(mockDeliverAllocationPlan).toHaveBeenCalled();
  });
});