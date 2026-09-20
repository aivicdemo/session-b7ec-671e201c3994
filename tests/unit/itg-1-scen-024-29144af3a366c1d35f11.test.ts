import { runTx2Imp2Agent } from '../../src/agents/tx-2-imp-2/orchestrator';

// AllocationPlanGenerationFailedError のカスタムエラークラスを定義
class AllocationPlanGenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllocationPlanGenerationFailedError';
    Object.setPrototypeOf(this, AllocationPlanGenerationFailedError.prototype);
  }
}

describe('SCEN-024: 配置案生成アルゴリズムが失敗した場合', () => {
  it('AllocationPlanGenerationFailedError が発生する', async () => {
    // テスト用の入力値を準備
    const input = {
      facilityId: 'FAC-001',
      teamId: null,
      workInstructionId: null,
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      executingUserId: 'USER-001',
      autoApprovalEnabled: true,
    };

    // モックAIクライアントを作成
    const mockAiClient = {
      authorizeOperation: jest.fn().mockResolvedValue({
        authorized: true,
      }),
      validateReferentialIntegrity: jest.fn().mockResolvedValue({
        valid: true,
      }),
      listProductivityDataByCondition: jest.fn().mockResolvedValue({
        productivityDataList: Array(20)
          .fill(null)
          .map((_, i) => ({
            productivityDataId: `PROD-${i}`,
            workerId: `WORKER-${i}`,
            productivityRate: 80 + Math.random() * 20,
            qualityScore: 85,
          })),
      }),
      getWorkerWithProficiencyAndProductivity: jest.fn().mockResolvedValue({
        workers: [],
      }),
      judgeAllocationPlanApprovalWithCriteria: jest.fn(),
      generateAllocationPlans: jest
        .fn()
        .mockRejectedValue(
          new AllocationPlanGenerationFailedError(
            '最適配置案の生成に失敗しました。作業者習熟度情報を確認してください。'
          )
        ),
      autoApproveAndDeliverPlans: jest.fn(),
      deliverInstructionsToFieldLeaders: jest.fn(),
    };

    // runTx2Imp2Agent を呼び出してエラーが発生することを検証
    await expect(runTx2Imp2Agent(input, mockAiClient)).rejects.toThrow(
      AllocationPlanGenerationFailedError
    );

    // エラー内容を詳細検証
    try {
      await runTx2Imp2Agent(input, mockAiClient);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(AllocationPlanGenerationFailedError);
      expect(error).toHaveProperty('name', 'AllocationPlanGenerationFailedError');
      expect((error as Error).message).toContain('最適配置案の生成に失敗しました');
      expect((error as Error).message).toContain('作業者習熟度情報を確認してください');
    }

    // generateAllocationPlans が呼び出されたことを確認
    expect(mockAiClient.generateAllocationPlans).toHaveBeenCalled();

    // 後続の承認判定処理が実行されていないことを確認
    expect(mockAiClient.judgeAllocationPlanApprovalWithCriteria).not.toHaveBeenCalled();

    // 後続の配信処理が実行されていないことを確認
    expect(mockAiClient.autoApproveAndDeliverPlans).not.toHaveBeenCalled();
    expect(mockAiClient.deliverInstructionsToFieldLeaders).not.toHaveBeenCalled();
  });
});