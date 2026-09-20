import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-667: listProficienciesByCondition with invalid page number', () => {
  it('should throw InvalidPaginationError when pageNumber is less than 1', async () => {
    const input = {
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
      pageNumber: 0,
      pageSize: undefined,
    };

    await expect(async () => {
      await listProficienciesByCondition(input);
    }).rejects.toThrow();

    try {
      await listProficienciesByCondition(input);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.name).toBe('InvalidPaginationError');
        expect(error.message).toBe('ページ番号とページサイズは1以上である必要があります。');
      } else {
        throw new Error('Expected an Error to be thrown');
      }
    }
  });
});