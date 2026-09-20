import { executePlacementChangeWithApproval } from '../../src/logic/placement-change-execution';
import * as placementChangeExecutionModule from '../../src/logic/placement-change-execution';

describe('SCEN-398: 配置対象の作業者が他の配置計画に割り当てられており変更不可の状態である場合', () => {
  it('エラー「この作業者は現在配置変更できません。稼働状況を確認してください。」が返される', async () => {
    // 前提条件の準備
    const placementProposalId = 'proposal-001';
    const approverUserId = 'user-approver-001';
    const executorUserId = 'user-executor-001';
    const requestTimestamp = new Date().toISOString();
    const workerId = 'worker-001';

    const input = {
      placementProposalId,
      approverUserId,
      executorUserId,
      approvalReason: '配置変更承認',
      executionNotes: '実行上の備考',
      requestTimestamp,
    };

    // 対象作業者が既に他の配置計画に割り当てられており変更不可の状態であることを前提に、
    // findPlacementPlanByWorkerAndDate スタブを「対象作業者の別の配置計画が指定日時に存在する」と設定する
    const existingPlacementPlan = {
      配置計画ID: 'existing-plan-001',
      作業者ID: workerId,
      配置部門: '既存部門',
      配置職務: '既存職務',
      開始日: new Date(Date.now() - 86400000).toISOString(),
      終了日: new Date(Date.now() + 86400000).toISOString(),
      配置ステータス: '実行中',
    };

    jest.spyOn(placementChangeExecutionModule, 'findPlacementPlanByWorkerAndDate' as any).mockResolvedValue(existingPlacementPlan);

    // 配置変更の記録関数がスタブ化されていることを前提に設定
    const savePlacementPlanSpy = jest.spyOn(placementChangeExecutionModule, 'savePlacementPlan' as any).mockResolvedValue({ 配置計画ID: 'new-plan-001' });
    const saveAllocationChangeHistorySpy = jest.spyOn(placementChangeExecutionModule, 'saveAllocationChangeHistory' as any).mockResolvedValue({ 割当変更履歴ID: 'history-001' });
    const deliverPlacementInstructionToFieldLeaderSpy = jest.spyOn(placementChangeExecutionModule, 'deliverPlacementInstructionToFieldLeader' as any).mockResolvedValue({ delivered: true });

    // executePlacementChangeWithApproval を呼び出す
    const result = await executePlacementChangeWithApproval(input);

    // 戻り値の success フィールドが false であることを確認
    expect(result.success).toBe(false);

    // 戻り値の errorMessage フィールドが正しいエラーメッセージであることを確認
    expect(result.errorMessage).toBe(
      'この作業者は現在配置変更できません。稼働状況を確認してください。'
    );

    // 戻り値の allocationChangeHistoryId フィールドが null であることを確認
    expect(result.allocationChangeHistoryId).toBeNull();

    // 戻り値の newPlacementPlanId フィールドが null であることを確認
    expect(result.newPlacementPlanId).toBeNull();

    // 戻り値の placementChangeDetails フィールドが null であることを確認
    expect(result.placementChangeDetails).toBeNull();

    // 戻り値の executionTimestamp フィールドが ISO 8601 形式の有効なタイムスタンプであることを確認
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 配置変更の記録（savePlacementPlan、saveAllocationChangeHistory）は実行されないことを確認
    expect(savePlacementPlanSpy).not.toHaveBeenCalled();
    expect(saveAllocationChangeHistorySpy).not.toHaveBeenCalled();

    // 現場リーダーへの配置指示配信（deliverPlacementInstructionToFieldLeader）は実行されないことを確認
    expect(deliverPlacementInstructionToFieldLeaderSpy).not.toHaveBeenCalled();

    // スパイの後片付け
    savePlacementPlanSpy.mockRestore();
    saveAllocationChangeHistorySpy.mockRestore();
    deliverPlacementInstructionToFieldLeaderSpy.mockRestore();
  });
});