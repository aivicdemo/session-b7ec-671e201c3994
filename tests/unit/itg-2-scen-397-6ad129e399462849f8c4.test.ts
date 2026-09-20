import { executePlacementChangeWithApproval, ExecutePlacementChangeWithApprovalInput } from '../../src/logic/placement-change-execution';

describe('SCEN-397: 配置案の状態検証エラーハンドリング', () => {
  it('should return error when placement proposal is already approved', async () => {
    // 配置案IDが既に承認済み状態である配置案を準備する
    // 実際のデータベースから既に承認済み状態の配置案を取得、または
    // モック/テストデータとして事前に承認済み状態に設定された配置案IDを使用
    const placementProposalId = 'already-approved-proposal-id';
    const approverUserId = 'valid-approver-id';
    const executorUserId = 'valid-executor-id';
    const approvalReason = '承認理由';
    const executionNotes = '実行備考';
    const requestTimestamp = new Date().toISOString();

    const input: ExecutePlacementChangeWithApprovalInput = {
      placementProposalId,
      approverUserId,
      executorUserId,
      approvalReason,
      executionNotes,
      requestTimestamp,
    };

    // executePlacementChangeWithApprovalに入力を与えて呼び出す
    const result = await executePlacementChangeWithApproval(input);

    // 戻り値のsuccess、allocationChangeHistoryId、newPlacementPlanId、placementChangeDetailsの値を確認する
    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();

    // 戻り値のerrorMessageの値を確認する
    expect(result.errorMessage).toBe(
      'この配置案は既に処理済みです。状態を確認してください。'
    );
  });
});