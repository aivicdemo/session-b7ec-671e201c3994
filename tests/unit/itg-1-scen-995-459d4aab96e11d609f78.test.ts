import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-995: 対応状況で検索結果を絞り込む', () => {
  it('actionStatuses で指定した対応状況に合致するレコードのみを返すこと', async () => {
    // Arrange
    const input = {
      actionStatuses: ['未対応', '対応中'],
      pageNumber: 1,
      pageSize: 50,
    };

    // Act
    const result = await listDelayRiskJudgmentByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

    // すべてのレコードが指定した actionStatuses に含まれる対応状況を持つことを確認
    result.delayRiskJudgments.forEach((record) => {
      expect(['未対応', '対応中']).toContain(record.actionStatus);
    });

    // totalCount が対応状況に合致するレコード総数と一致していることを確認
    expect(result.totalCount).toBe(result.delayRiskJudgments.length);

    // ページネーション情報が正しく設定されていることを確認
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    // retrievedAt が ISO 8601 形式のタイムスタンプであることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
  });

  it('actionStatuses が複数指定されたときにすべての対応状況を含むレコードが返されること', async () => {
    // Arrange
    const input = {
      actionStatuses: ['未対応', '対応中', '完了'],
      pageNumber: 1,
      pageSize: 100,
    };

    // Act
    const result = await listDelayRiskJudgmentByCondition(input);

    // Assert
    const validStatuses = ['未対応', '対応中', '完了'];
    result.delayRiskJudgments.forEach((record) => {
      expect(validStatuses).toContain(record.actionStatus);
    });

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(100);
    expect(result.retrievedAt).toBeDefined();
  });

  it('actionStatuses のみ指定して他の条件は適用しないこと', async () => {
    // Arrange
    const input = {
      actionStatuses: ['未対応'],
      riskJudgmentIds: undefined,
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      riskLevels: undefined,
      pageNumber: 1,
      pageSize: 50,
    };

    // Act
    const result = await listDelayRiskJudgmentByCondition(input);

    // Assert
    result.delayRiskJudgments.forEach((record) => {
      expect(record.actionStatus).toBe('未対応');
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
  });
});