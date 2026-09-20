import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-672: ページネーション結果が最後のページを超える場合、空の配列が返される', () => {
  beforeAll(async () => {
    // テスト環境にダミーの習熟度データを100件作成する
    const dummyProficiencies = Array.from({ length: 100 }, (_, i) => ({
      proficiencyId: `proficiency-${i + 1}`,
      workerId: `worker-${(i % 10) + 1}`,
      jobType: `jobType-${(i % 5) + 1}`,
      proficiencyLevel: `level-${(i % 3) + 1}`,
      evaluationDate: new Date(2024, 0, 1 + (i % 28)).toISOString(),
      evaluatedBy: `evaluator-${(i % 3) + 1}`,
      remarks: `Test proficiency ${i + 1}`,
      createdAt: new Date(2024, 0, 1).toISOString(),
      updatedAt: new Date(2024, 0, 1).toISOString(),
      createdBy: 'system',
      updatedBy: null,
    }));
    
    // ダミーデータをデータベースに挿入（実装による具体的な挿入方法は省略）
    // 実際のテスト環境では、テストデータベースにこれらのデータを事前に投入する
  });

  it('should return empty proficiencies array when pageNumber exceeds available pages', async () => {
    const input = {
      pageNumber: 999999,
      pageSize: 10,
      proficiencyIds: undefined,
      workerIds: undefined,
      jobTypes: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };

    const result = await listProficienciesByCondition(input);

    // ページネーション計算の検証：
    // 総件数100件、ページサイズ10の場合、最大ページ数は 10ページ（1～10）
    // ページ999999は明らかにデータ範囲を超えているため、proficiencies は空配列となることを確認
    const maxPages = Math.ceil(100 / 10);
    expect(input.pageNumber).toBeGreaterThan(maxPages);
    
    // 期待結果の検証
    expect(result.proficiencies).toEqual([]);
    expect(result.totalCount).toBe(100);
    expect(result.pageNumber).toBe(999999);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
  });
});