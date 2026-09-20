import { listWorkResultsByCondition } from '../../src/logic/data-persistence';
import type { ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-728: 実績数量の範囲で検索して合致するデータが返される', () => {
  let testData: Array<{
    workResultId: string;
    actualQuantity: number;
    workStatus: string;
  }>;

  beforeEach(() => {
    testData = [
      { workResultId: 'WR001', actualQuantity: 50, workStatus: '完了' },
      { workResultId: 'WR002', actualQuantity: 75, workStatus: '完了' },
      { workResultId: 'WR003', actualQuantity: 100, workStatus: '完了' },
      { workResultId: 'WR004', actualQuantity: 150, workStatus: '完了' },
      { workResultId: 'WR005', actualQuantity: 200, workStatus: '完了' },
    ];
  });

  it('実績数量が指定範囲内のレコードを返す', async () => {
    const input: ListWorkResultsByConditionInput = {
      minActualQuantity: 60,
      maxActualQuantity: 120,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    expect(result.workResults).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    const workResultIds = result.workResults.map((wr) => wr.workResultId);
    expect(workResultIds).toContain('WR002');
    expect(workResultIds).toContain('WR003');

    const quantities = result.workResults.map((wr) => wr.actualQuantity);
    expect(quantities).toEqual(expect.arrayContaining([75, 100]));
    expect(quantities.every((q) => q >= 60 && q <= 120)).toBe(true);

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});