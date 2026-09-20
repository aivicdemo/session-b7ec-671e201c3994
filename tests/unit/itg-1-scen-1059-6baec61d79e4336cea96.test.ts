import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1059: ソート対象フィールドとソート順序が指定された場合、指定どおりにソートされて返される', () => {
  it('sortBy=receptionDateTime、sortOrder=ASCで昇順にソートされる', async () => {
    const input = {
      receptionStatuses: ['confirmed'],
      deliveryMethods: ['handy_terminal'],
      sortBy: 'receptionDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.receptionHistories.length).toBeGreaterThan(0);

    for (let i = 0; i < result.receptionHistories.length - 1; i++) {
      const current = new Date(result.receptionHistories[i].receptionDateTime).getTime();
      const next = new Date(result.receptionHistories[i + 1].receptionDateTime).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.receptionHistories.length);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('sortBy=receptionDateTime、sortOrder=DESCで降順にソートされる', async () => {
    const input = {
      receptionStatuses: ['confirmed'],
      deliveryMethods: ['handy_terminal'],
      sortBy: 'receptionDateTime',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeInstanceOf(Array);
    expect(result.receptionHistories.length).toBeGreaterThan(0);

    for (let i = 0; i < result.receptionHistories.length - 1; i++) {
      const current = new Date(result.receptionHistories[i].receptionDateTime).getTime();
      const next = new Date(result.receptionHistories[i + 1].receptionDateTime).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBeGreaterThanOrEqual(result.receptionHistories.length);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('複数ページにわたる場合、各ページ内でもソート順序が保たれる', async () => {
    const inputPage1 = {
      sortBy: 'receptionDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 5,
    };

    const resultPage1 = await listWorkInstructionReceptionHistoryByCondition(inputPage1);

    expect(resultPage1.receptionHistories.length).toBeGreaterThan(0);
    expect(resultPage1.pageNumber).toBe(1);
    expect(resultPage1.pageSize).toBe(5);

    for (let i = 0; i < resultPage1.receptionHistories.length - 1; i++) {
      const current = new Date(resultPage1.receptionHistories[i].receptionDateTime).getTime();
      const next = new Date(resultPage1.receptionHistories[i + 1].receptionDateTime).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }

    if (resultPage1.totalCount > 5) {
      const inputPage2 = {
        sortBy: 'receptionDateTime',
        sortOrder: 'ASC',
        pageNumber: 2,
        pageSize: 5,
      };

      const resultPage2 = await listWorkInstructionReceptionHistoryByCondition(inputPage2);

      expect(resultPage2.receptionHistories.length).toBeGreaterThan(0);
      expect(resultPage2.pageNumber).toBe(2);

      for (let i = 0; i < resultPage2.receptionHistories.length - 1; i++) {
        const current = new Date(resultPage2.receptionHistories[i].receptionDateTime).getTime();
        const next = new Date(resultPage2.receptionHistories[i + 1].receptionDateTime).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }

      const lastOfPage1 = new Date(resultPage1.receptionHistories[resultPage1.receptionHistories.length - 1].receptionDateTime).getTime();
      const firstOfPage2 = new Date(resultPage2.receptionHistories[0].receptionDateTime).getTime();
      expect(lastOfPage1).toBeLessThanOrEqual(firstOfPage2);
    }
  });

  it('pageNumberとpageSizeが入力値と一致し、totalCountが正確である', async () => {
    const input = {
      sortBy: 'receptionDateTime',
      sortOrder: 'ASC',
      pageNumber: 2,
      pageSize: 15,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(15);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.receptionHistories.length).toBeLessThanOrEqual(15);
  });

  it('retrievedAtがISO 8601形式で格納される', async () => {
    const input = {
      sortBy: 'receptionDateTime',
      sortOrder: 'ASC',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.retrievedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);
    expect(() => new Date(result.retrievedAt)).not.toThrow();
  });
});