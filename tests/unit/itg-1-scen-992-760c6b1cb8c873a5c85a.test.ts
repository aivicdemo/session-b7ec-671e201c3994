import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-992: 拠点IDで検索結果を絞り込む', () => {
  it('facilityIds=[\'facility-001\']を指定して検索した場合、該当する進捗遅延リスク判定結果のみが返却される', async () => {
    // Arrange
    const input = {
      facilityIds: ['facility-001'],
    };

    // Act
    const output = await listDelayRiskJudgmentByCondition(input);

    // Assert
    expect(output).toBeDefined();
    expect(output.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(output.delayRiskJudgments)).toBe(true);

    // 返却されたデータが全て facilityIds=['facility-001'] に合致することを確認
    output.delayRiskJudgments.forEach((judgment) => {
      expect(judgment.facilityId).toBe('facility-001');
    });

    // totalCount が 0 以上の整数値であることを確認
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(output.totalCount)).toBe(true);

    // delayRiskJudgments の件数が totalCount 以下であることを確認
    expect(output.delayRiskJudgments.length).toBeLessThanOrEqual(output.totalCount);

    // retrievedAt が ISO 8601 形式の文字列であることを確認
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(output.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    // ISO 8601 形式であることを確認（T を含む）
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});