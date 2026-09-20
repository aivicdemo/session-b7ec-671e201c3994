import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-993: チームIDで検索結果を絞り込む', () => {
  it('should retrieve delay risk judgment records filtered by teamIds', async () => {
    // テスト対象の入力値を構築する
    const input = {
      teamIds: ['team-001', 'team-002'],
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
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
      sortBy: 'riskLevel',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 20,
    };

    // listDelayRiskJudgmentByCondition 処理を呼び出す
    const output = await listDelayRiskJudgmentByCondition(input);

    // 返却値の構造を検証する
    expect(output).toBeDefined();
    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');

    // ページング情報を検証する
    expect(output.pageNumber).toBe(1);
    expect(output.pageSize).toBe(20);
    expect(output.delayRiskJudgments.length).toBeLessThanOrEqual(20);
    if (output.totalCount < 20) {
      expect(output.delayRiskJudgments.length).toBeLessThanOrEqual(output.totalCount);
    }

    // すべてのレコードがチームIDで絞り込まれていることを検証する
    output.delayRiskJudgments.forEach((record) => {
      expect(record.teamId).toBeDefined();
      expect(['team-001', 'team-002']).toContain(record.teamId);
    });

    // retrievedAt が ISO 8601 形式であることを検証する
    const retrievedAtDate = new Date(output.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // リスクレベルが DESC でソートされていることを検証する
    if (output.delayRiskJudgments.length > 1) {
      const riskLevelMap: { [key: string]: number } = {
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1,
      };
      for (let i = 0; i < output.delayRiskJudgments.length - 1; i++) {
        const currentLevel = riskLevelMap[output.delayRiskJudgments[i].riskLevel] || 0;
        const nextLevel = riskLevelMap[output.delayRiskJudgments[i + 1].riskLevel] || 0;
        expect(currentLevel).toBeGreaterThanOrEqual(nextLevel);
      }
    }
  });
});