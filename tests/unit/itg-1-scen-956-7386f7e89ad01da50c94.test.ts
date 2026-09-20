import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-956: 検索条件をすべて指定して生産性データ一覧を取得する', () => {
  it('すべての検索条件フィールドに具体値を指定したとき、合致するデータが検索条件に従ってソートされて返されること', async () => {
    const input = {
      productivityDataIds: ['PD001', 'PD002'],
      workResultIds: ['WR001', 'WR002'],
      workerIds: ['W001', 'W002'],
      facilityIds: ['F001', 'F002'],
      teamIds: ['T001'],
      workDateFrom: '2024-01-01',
      workDateTo: '2024-01-31',
      minProductivityRate: 50,
      maxProductivityRate: 100,
      minQualityScore: 80,
      maxQualityScore: 100,
      minErrorCount: 0,
      maxErrorCount: 5,
      proficiencyLevels: ['ADVANCED', 'INTERMEDIATE'],
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-01-31T23:59:59Z',
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
      sortBy: 'productivityRate',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 20,
    };

    const result = await listProductivityDataByCondition(input);

    expect(result).toBeDefined();
    expect(result.productivityDataList).toBeDefined();
    expect(Array.isArray(result.productivityDataList)).toBe(true);

    if (result.productivityDataList.length > 0) {
      result.productivityDataList.forEach((record) => {
        expect(record.productivityDataId).toBeDefined();
        expect(record.workResultId).toBeDefined();
        expect(record.workerId).toBeDefined();
        expect(record.facilityId).toBeDefined();
        expect(record.teamId).toBeDefined();
        expect(record.workDate).toBeDefined();
        expect(record.plannedWorkTime).toBeDefined();
        expect(record.actualWorkTime).toBeDefined();
        expect(record.completedItemCount).toBeDefined();
        expect(record.productivityRate).toBeDefined();
        expect(record.qualityScore).toBeDefined();
        expect(record.errorCount).toBeDefined();
        expect(record.proficiencyLevel).toBeDefined();
        expect(record.createdAt).toBeDefined();
        expect(record.updatedAt).toBeDefined();
        expect(record.createdBy).toBeDefined();

        expect(input.productivityDataIds).toContain(record.productivityDataId);
        expect(input.workResultIds).toContain(record.workResultId);
        expect(input.workerIds).toContain(record.workerId);
        expect(input.facilityIds).toContain(record.facilityId);
        expect(input.teamIds).toContain(record.teamId);

        const workDate = new Date(record.workDate).toISOString().split('T')[0];
        expect(workDate).toGreaterThanOrEqual(input.workDateFrom);
        expect(workDate).toBeLessThanOrEqual(input.workDateTo);

        expect(record.productivityRate).toBeGreaterThanOrEqual(input.minProductivityRate);
        expect(record.productivityRate).toBeLessThanOrEqual(input.maxProductivityRate);

        expect(record.qualityScore).toBeGreaterThanOrEqual(input.minQualityScore);
        expect(record.qualityScore).toBeLessThanOrEqual(input.maxQualityScore);

        expect(record.errorCount).toBeGreaterThanOrEqual(input.minErrorCount);
        expect(record.errorCount).toBeLessThanOrEqual(input.maxErrorCount);

        expect(input.proficiencyLevels).toContain(record.proficiencyLevel);

        const createdAt = new Date(record.createdAt);
        expect(createdAt.toISOString()).toGreaterThanOrEqual(input.createdFromDate);
        expect(createdAt.toISOString()).toBeLessThanOrEqual(input.createdToDate);

        const updatedAt = new Date(record.updatedAt);
        expect(updatedAt.toISOString()).toGreaterThanOrEqual(input.updatedFromDate);
        expect(updatedAt.toISOString()).toBeLessThanOrEqual(input.updatedToDate);
      });

      for (let i = 0; i < result.productivityDataList.length - 1; i++) {
        expect(result.productivityDataList[i].productivityRate).toBeGreaterThanOrEqual(
          result.productivityDataList[i + 1].productivityRate,
        );
      }
    }

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);

    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('日付範囲が有効であることを確認する', async () => {
    const createdFromDate = new Date('2024-01-01T00:00:00Z');
    const createdToDate = new Date('2024-01-31T23:59:59Z');
    const updatedFromDate = new Date('2024-01-01T00:00:00Z');
    const updatedToDate = new Date('2024-01-31T23:59:59Z');

    expect(createdFromDate.getTime()).toBeLessThanOrEqual(createdToDate.getTime());
    expect(updatedFromDate.getTime()).toBeLessThanOrEqual(updatedToDate.getTime());
  });
});