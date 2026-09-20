import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-662: 複数の検索条件を組み合わせて習熟度データを取得できる', () => {
  it('指定された複数検索条件に合致する習熟度データを取得し、ソート・ページネーション・メタデータが正しく設定されていることを検証する', async () => {
    const input = {
      workerIds: ['W001', 'W002'],
      jobTypes: ['assembling', 'packing'],
      proficiencyLevels: ['level3', 'level4'],
      evaluatedFromDate: '2024-01-01',
      evaluatedToDate: '2024-12-31',
      sortBy: 'proficiencyId',
      sortOrder: 'desc',
      pageNumber: 1,
      pageSize: 10,
    };

    const output = await listProficienciesByCondition(input);

    // (1) workerIds フィルタ検証
    expect(output.proficiencies).toBeDefined();
    expect(Array.isArray(output.proficiencies)).toBe(true);
    output.proficiencies.forEach((record) => {
      expect(['W001', 'W002']).toContain(record.workerId);
    });

    // (2) jobTypes フィルタ検証
    output.proficiencies.forEach((record) => {
      expect(['assembling', 'packing']).toContain(record.jobType);
    });

    // (3) proficiencyLevels フィルタ検証
    output.proficiencies.forEach((record) => {
      expect(['level3', 'level4']).toContain(record.proficiencyLevel);
    });

    // (4) 評価日の範囲フィルタ検証
    output.proficiencies.forEach((record) => {
      const evaluationDate = new Date(record.evaluationDate);
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31T23:59:59.999Z');
      expect(evaluationDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(evaluationDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // (5) ソート検証（proficiencyId 降順）
    if (output.proficiencies.length > 1) {
      for (let i = 0; i < output.proficiencies.length - 1; i++) {
        expect(
          output.proficiencies[i].proficiencyId.localeCompare(
            output.proficiencies[i + 1].proficiencyId
          )
        ).toBeGreaterThanOrEqual(0);
      }
    }

    // (6) ページネーション検証
    expect(output.proficiencies.length).toBeLessThanOrEqual(10);
    expect(output.pageNumber).toBe(1);
    expect(output.pageSize).toBe(10);

    // (7) totalCount 検証
    expect(output.totalCount).toBeDefined();
    expect(typeof output.totalCount).toBe('number');
    expect(output.totalCount).toBeGreaterThanOrEqual(output.proficiencies.length);

    // (8) retrievedAt 検証
    expect(output.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(output.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(retrievedAtDate.getTime()).toBeGreaterThan(new Date().getTime() - 60000);
  });
});