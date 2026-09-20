import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';

describe('SCEN-970: 既存判定IDを指定した更新時に判定内容・推奨対応を上書き保存', () => {
  it('should update existing delay risk judgment and return same ID with isNewRecord=false', async () => {
    // Arrange: 既存の進捗遅延リスク判定データを作成してデータベースに保存
    const initialInput = {
      riskJudgmentId: null as string | null | undefined,
      workInstructionId: 'wi-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      judgmentDateTime: '2024-01-15T14:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 3,
      progressRate: 45,
      plannedProgressRate: 65,
      judgmentReason: '初期判定：作業効率が計画比-20%に低下',
      recommendedAction: '追加作業者の配置を検討',
      actionStatus: '未対応',
      createdBy: 'user-manager-001',
    };

    // 初回作成により、実際にデータベースに保存される
    const initialResult = await saveDelayRiskJudgment(initialInput);
    const existingRiskJudgmentId = initialResult.riskJudgmentId;

    // 初回作成時の基本情報を記録
    const initialWorkInstructionId = initialResult.workInstructionId;
    const initialFacilityId = initialResult.facilityId;
    const initialTeamId = initialResult.teamId;
    const initialRiskLevel = initialResult.riskLevel;
    const initialDelayPredictionDays = initialResult.delayPredictionDays;

    // Act: 既存判定IDを指定して更新
    // validateReferentialIntegrity, validateDateTimeRange, validateNumericQuantity は
    // saveDelayRiskJudgment 内部で検証済みとして機能することを前提とする
    const updateInput = {
      riskJudgmentId: existingRiskJudgmentId,
      workInstructionId: 'wi-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      judgmentDateTime: '2024-01-15T14:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 3,
      progressRate: 45,
      plannedProgressRate: 65,
      judgmentReason: '作業効率が計画比-25%に低下',
      recommendedAction: '熟練作業者2名を追加配置し、作業ペースを回復させる',
      actionStatus: '対応中',
      createdBy: 'user-manager-001',
      updatedBy: 'user-manager-002',
    };

    const updateResult = await saveDelayRiskJudgment(updateInput);

    // Assert
    // 1. riskJudgmentId が初回作成時と同じIDであることを確認
    expect(updateResult.riskJudgmentId).toBe(existingRiskJudgmentId);

    // 2. isNewRecord が false であることを確認（update操作）
    expect(updateResult.isNewRecord).toBe(false);

    // 3. 更新対象のフィールドが新しい値に上書き保存されていることを確認
    expect(updateResult.recommendedAction).toBe(
      '熟練作業者2名を追加配置し、作業ペースを回復させる'
    );

    // 4. 基本情報（変更されないべきフィールド）が初回作成時と一致していることを確認
    expect(updateResult.workInstructionId).toBe(initialWorkInstructionId);
    expect(updateResult.facilityId).toBe(initialFacilityId);
    expect(updateResult.teamId).toBe(initialTeamId);
    expect(updateResult.riskLevel).toBe(initialRiskLevel);
    expect(updateResult.delayPredictionDays).toBe(initialDelayPredictionDays);

    // 5. savedAt がISO 8601形式の有効な日時であり、更新実行時刻の直近であることを確認
    expect(updateResult.savedAt).toBeDefined();
    const savedAtTime = new Date(updateResult.savedAt);
    expect(savedAtTime.getTime()).toBeLessThanOrEqual(Date.now());
    expect(savedAtTime.getTime()).toBeGreaterThan(Date.now() - 5000);
  });
});