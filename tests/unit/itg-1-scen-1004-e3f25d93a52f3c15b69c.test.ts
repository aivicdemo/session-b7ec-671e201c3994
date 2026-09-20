import {
  listDelayRiskJudgmentByCondition,
  ListDelayRiskJudgmentByConditionInput,
  ListDelayRiskJudgmentByConditionOutput,
  SaveDelayRiskJudgmentInput,
  saveDelayRiskJudgment,
} from '../../src/logic/data-persistence';

describe('SCEN-1004: 全件数がページサイズを超える場合に総件数を正確に返す', () => {
  beforeAll(async () => {
    // 検索条件に合致する進捗遅延リスク判定結果データを25件事前登録
    const testDataList: SaveDelayRiskJudgmentInput[] = [];
    for (let i = 0; i < 25; i++) {
      testDataList.push({
        workInstructionId: `work-instruction-${i}`,
        facilityId: `facility-${i % 3}`,
        teamId: `team-${i % 5}`,
        judgmentDateTime: new Date(Date.now() - i * 1000000).toISOString(),
        riskLevel: 'HIGH',
        delayPredictionDays: i,
        progressRate: (i * 4) % 101,
        plannedProgressRate: ((i + 1) * 4) % 101,
        judgmentReason: `Risk judgment reason ${i}`,
        recommendedAction: `Recommended action ${i}`,
        actionStatus: 'pending',
        createdBy: 'test-user',
      });
    }

    for (const input of testDataList) {
      await saveDelayRiskJudgment(input);
    }
  });

  it('検索条件に合致する進捗遅延リスク判定結果データの一覧をページネーション付きで取得し、総件数を正確に返す', async () => {
    const input: ListDelayRiskJudgmentByConditionInput = {
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListDelayRiskJudgmentByConditionOutput = await listDelayRiskJudgmentByCondition(input);

    expect(result.totalCount).toBe(25);
    expect(result.delayRiskJudgments).toHaveLength(10);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    // ISO 8601形式の検証：YYYY-MM-DDTHH:mm:ss.sssZ または YYYY-MM-DDTHH:mm:ss+HH:mm の形式
    expect(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(result.retrievedAt),
    ).toBe(true);

    result.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.riskJudgmentId).toBeDefined();
      expect(typeof judgment.riskJudgmentId).toBe('string');
      expect(judgment.workInstructionId).toBeDefined();
      expect(typeof judgment.workInstructionId).toBe('string');
      expect(judgment.facilityId).toBeDefined();
      expect(typeof judgment.facilityId).toBe('string');
      expect(judgment.teamId).toBeDefined();
      expect(typeof judgment.teamId).toBe('string');
      expect(judgment.judgmentDateTime).toBeDefined();
      expect(typeof judgment.judgmentDateTime).toBe('string');
      expect(judgment.riskLevel).toBeDefined();
      expect(typeof judgment.riskLevel).toBe('string');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(judgment.riskLevel);
      expect(judgment.delayPredictionDays).toBeGreaterThanOrEqual(0);
      expect(typeof judgment.delayPredictionDays).toBe('number');
      expect(judgment.progressRate).toBeGreaterThanOrEqual(0);
      expect(judgment.progressRate).toBeLessThanOrEqual(100);
      expect(typeof judgment.progressRate).toBe('number');
      expect(judgment.plannedProgressRate).toBeGreaterThanOrEqual(0);
      expect(judgment.plannedProgressRate).toBeLessThanOrEqual(100);
      expect(typeof judgment.plannedProgressRate).toBe('number');
      expect(judgment.judgmentReason).toBeDefined();
      expect(typeof judgment.judgmentReason).toBe('string');
      expect(judgment.recommendedAction).toBeDefined();
      expect(typeof judgment.recommendedAction).toBe('string');
      expect(judgment.createdAt).toBeDefined();
      expect(typeof judgment.createdAt).toBe('string');
      expect(judgment.updatedAt).toBeDefined();
      expect(typeof judgment.updatedAt).toBe('string');
      expect(judgment.createdBy).toBeDefined();
      expect(typeof judgment.createdBy).toBe('string');
    });
  });
});