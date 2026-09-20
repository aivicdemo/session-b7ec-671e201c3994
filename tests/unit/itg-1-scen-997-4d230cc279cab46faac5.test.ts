import { listDelayRiskJudgmentByCondition, saveDelayRiskJudgment } from '../../src/logic/data-persistence';

describe('SCEN-997: 進捗率の範囲で検索結果を絞り込む', () => {
  it('should filter delay risk judgments by progress rate range', async () => {
    // Arrange: テスト用の進捗遅延リスク判定結果データを準備
    const testDataInputs = [
      {
        riskJudgmentId: null,
        workInstructionId: 'work-1',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T10:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 30,
        plannedProgressRate: 30,
        judgmentReason: 'On track',
        recommendedAction: 'Continue',
        actionStatus: 'completed',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: null,
        workInstructionId: 'work-2',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T11:00:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: 1,
        progressRate: 50,
        plannedProgressRate: 55,
        judgmentReason: 'Slightly behind',
        recommendedAction: 'Monitor',
        actionStatus: 'in_progress',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: null,
        workInstructionId: 'work-3',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T12:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 75,
        plannedProgressRate: 75,
        judgmentReason: 'On track',
        recommendedAction: 'Continue',
        actionStatus: 'completed',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: null,
        workInstructionId: 'work-4',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T13:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 80,
        plannedProgressRate: 80,
        judgmentReason: 'On track',
        recommendedAction: 'Continue',
        actionStatus: 'completed',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: null,
        workInstructionId: 'work-5',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T14:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 10,
        plannedProgressRate: 15,
        judgmentReason: 'Initial phase',
        recommendedAction: 'Monitor',
        actionStatus: 'in_progress',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
      {
        riskJudgmentId: null,
        workInstructionId: 'work-6',
        facilityId: 'facility-1',
        teamId: 'team-1',
        judgmentDateTime: '2024-01-15T15:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 90,
        plannedProgressRate: 90,
        judgmentReason: 'Near completion',
        recommendedAction: 'Continue',
        actionStatus: 'completed',
        createdBy: 'user-1',
        updatedBy: undefined,
      },
    ];

    // テストデータをデータベースに保存
    for (const data of testDataInputs) {
      await saveDelayRiskJudgment(data);
    }

    // Act: listDelayRiskJudgmentByConditionを呼び出し
    const result = await listDelayRiskJudgmentByCondition({
      minProgressRate: 30,
      maxProgressRate: 80,
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      actionStatuses: undefined,
      minDelayPredictionDays: undefined,
      maxDelayPredictionDays: undefined,
      judgmentDateFromDateTime: undefined,
      judgmentDateToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // Assert: 検索結果を検証
    // 1. 返された配列のすべてのレコードがminProgressRate以上maxProgressRate以下であることを確認
    expect(result.delayRiskJudgments).toHaveLength(4);
    result.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.progressRate).toBeGreaterThanOrEqual(30);
      expect(judgment.progressRate).toBeLessThanOrEqual(80);
    });

    // 2. totalCountが条件に合致したレコード件数と一致することを確認
    expect(result.totalCount).toBe(4);

    // 3. retrievedAtがISO 8601形式の有効な日時文字列であることを確認
    expect(result.retrievedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );
    expect(() => new Date(result.retrievedAt)).not.toThrow();

    // 4. pageNumberおよびpageSizeがnull/undefinedまたは入力値と一致することを確認
    expect(result.pageNumber).toBeUndefined();
    expect(result.pageSize).toBeUndefined();

    // 5. 含まれるべきレコードの進捗率を確認
    const progressRates = result.delayRiskJudgments.map((j) => j.progressRate);
    expect(progressRates).toContain(30);
    expect(progressRates).toContain(50);
    expect(progressRates).toContain(75);
    expect(progressRates).toContain(80);

    // 6. 除外されるべきレコードが含まれないことを確認
    expect(progressRates).not.toContain(10);
    expect(progressRates).not.toContain(90);
  });
});