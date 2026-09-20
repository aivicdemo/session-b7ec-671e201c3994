import {
  listDelayRiskJudgmentByCondition,
  GetDelayRiskJudgmentByIdOutput,
  ListDelayRiskJudgmentByConditionOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-1002: ソート対象フィールドと順序を指定して結果を並び替える', () => {
  it('delayPredictionDaysで降順ソートした場合、遅延予測日数が大きい順に並ぶこと', async () => {
    // テスト用の進捗遅延リスク判定結果データを事前に準備
    const mockDelayRiskJudgments: GetDelayRiskJudgmentByIdOutput[] = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        judgmentDateTime: '2024-01-15T10:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 10,
        progressRate: 50,
        plannedProgressRate: 80,
        judgmentReason: '人員不足による進捗遅延',
        recommendedAction: '人員追加配置',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-002',
        teamId: 'team-002',
        judgmentDateTime: '2024-01-15T10:15:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 30,
        progressRate: 45,
        plannedProgressRate: 75,
        judgmentReason: '効率低下による遅延',
        recommendedAction: '優先度調整',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:15:00Z',
        updatedAt: '2024-01-15T09:15:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-003',
        facilityId: 'facility-003',
        teamId: 'team-003',
        judgmentDateTime: '2024-01-15T10:30:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 5,
        progressRate: 85,
        plannedProgressRate: 85,
        judgmentReason: '進捗順調',
        recommendedAction: 'なし',
        actionStatus: '完了',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: 'risk-004',
        workInstructionId: 'work-004',
        facilityId: 'facility-004',
        teamId: 'team-004',
        judgmentDateTime: '2024-01-15T10:45:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 25,
        progressRate: 40,
        plannedProgressRate: 70,
        judgmentReason: '品質問題による手戻り増加',
        recommendedAction: '品質管理強化',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:45:00Z',
        updatedAt: '2024-01-15T09:45:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: 'risk-005',
        workInstructionId: 'work-005',
        facilityId: 'facility-005',
        teamId: 'team-005',
        judgmentDateTime: '2024-01-15T11:00:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 15,
        progressRate: 60,
        plannedProgressRate: 80,
        judgmentReason: '部分的な遅延発生',
        recommendedAction: '進捗監視強化',
        actionStatus: '対応中',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        riskJudgmentId: 'risk-006',
        workInstructionId: 'work-006',
        facilityId: 'facility-006',
        teamId: 'team-006',
        judgmentDateTime: '2024-01-15T11:15:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 0,
        progressRate: 100,
        plannedProgressRate: 100,
        judgmentReason: '完了',
        recommendedAction: 'なし',
        actionStatus: '完了',
        createdAt: '2024-01-15T10:15:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        createdBy: 'user-001',
        updatedBy: undefined,
      },
    ];

    // モック関数の呼び出し。実装では外部システムから取得したデータをフィルタ・ソート
    const result: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition({
        riskJudgmentIds: undefined,
        workInstructionIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        riskLevels: undefined,
        actionStatuses: undefined,
        minDelayPredictionDays: undefined,
        maxDelayPredictionDays: undefined,
        minProgressRate: undefined,
        maxProgressRate: undefined,
        judgmentDateFromDateTime: undefined,
        judgmentDateToDateTime: undefined,
        createdFromDate: undefined,
        createdToDate: undefined,
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: 'delayPredictionDays',
        sortOrder: 'DESC',
        pageNumber: 1,
        pageSize: 10,
      });

    // 出力型のdelayRiskJudgmentsフィールドを検証
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    // delayPredictionDaysで降順ソートされていることを確認
    const delayPredictionDays = result.delayRiskJudgments.map(
      (item) => item.delayPredictionDays
    );
    expect(delayPredictionDays).toEqual([30, 25, 15, 10, 5, 0]);

    // 隣接する要素の遅延予測日数を比較し、前の要素が後ろの要素以上であることを検証
    for (let i = 0; i < result.delayRiskJudgments.length - 1; i++) {
      expect(result.delayRiskJudgments[i].delayPredictionDays).toBeGreaterThanOrEqual(
        result.delayRiskJudgments[i + 1].delayPredictionDays
      );
    }

    // その他の出力フィールドを検証
    expect(result.totalCount).toBe(6);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    // ISO 8601形式の日時として有効であることを確認
    expect(() => new Date(result.retrievedAt)).not.toThrow();
  });
});