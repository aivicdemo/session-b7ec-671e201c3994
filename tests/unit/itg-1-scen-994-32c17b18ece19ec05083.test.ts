import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';
import { ListDelayRiskJudgmentByConditionInput, GetDelayRiskJudgmentByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-994: リスクレベルで検索結果を絞り込む', () => {
  it('riskLevels で指定されたリスクレベルに合致する進捗遅延リスク判定結果のみを返却する', async () => {
    // テスト用スタブデータの準備
    const stubData: GetDelayRiskJudgmentByIdOutput[] = [
      {
        riskJudgmentId: 'risk-1',
        workInstructionId: 'work-1',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T10:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 2,
        progressRate: 40,
        plannedProgressRate: 60,
        judgmentReason: '進捗が計画比で大幅に遅延',
        recommendedAction: '人員増強が必要',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'user-1',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-2',
        workInstructionId: 'work-2',
        facilityId: 'facility-1',
        teamId: 'team-2',
        judgmentDateTime: '2024-01-15T10:15:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 1,
        progressRate: 60,
        plannedProgressRate: 70,
        judgmentReason: '進捗が計画比でやや遅延',
        recommendedAction: '優先順位の調整を検討',
        actionStatus: '対応中',
        createdAt: '2024-01-15T09:15:00Z',
        updatedAt: '2024-01-15T09:15:00Z',
        createdBy: 'user-2',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-3',
        workInstructionId: 'work-3',
        facilityId: 'facility-2',
        teamId: 'team-3',
        judgmentDateTime: '2024-01-15T10:30:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 80,
        plannedProgressRate: 75,
        judgmentReason: '進捗が計画通り',
        recommendedAction: '現在の体制で対応可能',
        actionStatus: '完了',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
        createdBy: 'user-3',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-4',
        workInstructionId: 'work-4',
        facilityId: 'facility-2',
        teamId: 'team-4',
        judgmentDateTime: '2024-01-15T10:45:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 3,
        progressRate: 30,
        plannedProgressRate: 70,
        judgmentReason: '進捗が計画比で大幅に遅延',
        recommendedAction: '緊急の人員配置が必要',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:45:00Z',
        updatedAt: '2024-01-15T09:45:00Z',
        createdBy: 'user-4',
        updatedBy: null,
      },
    ];

    // モック実装：listDelayRiskJudgmentByCondition は実装に基づいて動作
    // ここではテスト対象処理を直接呼び出すと仮定
    const input: ListDelayRiskJudgmentByConditionInput = {
      riskLevels: ['HIGH', 'MEDIUM'],
      pageNumber: 1,
      pageSize: 20,
    };

    // テスト対象処理の呼び出し
    const result = await listDelayRiskJudgmentByCondition(input);

    // 検証：返却されたリスク判定結果の件数が3件であることを確認
    expect(result.delayRiskJudgments).toHaveLength(3);

    // 検証：返却されるレコードはすべて riskLevels=['HIGH', 'MEDIUM'] に該当することを確認
    result.delayRiskJudgments.forEach((judgment) => {
      expect(['HIGH', 'MEDIUM']).toContain(judgment.riskLevel);
    });

    // 検証：LOW リスクレベルを持つレコードが含まれていないことを確認
    const hasLowRisk = result.delayRiskJudgments.some(
      (judgment) => judgment.riskLevel === 'LOW'
    );
    expect(hasLowRisk).toBe(false);

    // 検証：totalCount が 3 であることを確認
    expect(result.totalCount).toBe(3);

    // 検証：pageNumber が 1、pageSize が 20 であることを確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);

    // 検証：retrievedAt がISO 8601形式の日時であることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 検証：返却されたデータが正しい内容であることを確認
    const highRiskCount = result.delayRiskJudgments.filter(
      (j) => j.riskLevel === 'HIGH'
    ).length;
    const mediumRiskCount = result.delayRiskJudgments.filter(
      (j) => j.riskLevel === 'MEDIUM'
    ).length;
    expect(highRiskCount).toBe(2);
    expect(mediumRiskCount).toBe(1);
  });
});