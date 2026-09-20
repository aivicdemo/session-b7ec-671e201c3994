import { listAllocationExecutionStatusByCondition } from '../../src/logic/data-persistence';

describe('SCEN-871: ListAllocationExecutionStatusByCondition - Invalid DateTime Format Error', () => {
  it('should return InvalidConditionFormatError when plannedStartFromDateTime has invalid format', async () => {
    const input = {
      plannedStartFromDateTime: '2024-13-45T25:70:00Z',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when plannedStartToDateTime has invalid format', async () => {
    const input = {
      plannedStartToDateTime: '2024/01/01',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when plannedEndFromDateTime has invalid format', async () => {
    const input = {
      plannedEndFromDateTime: '01-01-2024',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when plannedEndToDateTime is empty string', async () => {
    const input = {
      plannedEndToDateTime: '',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when actualStartFromDateTime has invalid format', async () => {
    const input = {
      actualStartFromDateTime: 'invalid-date',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when actualStartToDateTime has invalid format', async () => {
    const input = {
      actualStartToDateTime: '2024-01-01 12:00:00',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when actualEndFromDateTime has invalid format', async () => {
    const input = {
      actualEndFromDateTime: '2024-01-01',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when actualEndToDateTime has invalid format', async () => {
    const input = {
      actualEndToDateTime: 'not-a-date',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when createdFromDate has invalid format', async () => {
    const input = {
      createdFromDate: '2024/13/45',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when createdToDate has invalid format', async () => {
    const input = {
      createdToDate: '2024-13-01',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when updatedFromDate has invalid format', async () => {
    const input = {
      updatedFromDate: 'yesterday',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when updatedToDate has invalid format', async () => {
    const input = {
      updatedToDate: 'tomorrow',
      pageNumber: 1,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when pageNumber is invalid', async () => {
    const input = {
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      pageNumber: 0,
      pageSize: 50,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });

  it('should return InvalidConditionFormatError when pageSize is invalid', async () => {
    const input = {
      plannedStartFromDateTime: '2024-01-01T00:00:00Z',
      pageNumber: 1,
      pageSize: 0,
    };

    await expect(listAllocationExecutionStatusByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidConditionFormatError',
        message: '検索条件の形式が不正です。日時はISO8601形式、ページ番号は1以上、ページサイズは1以上を指定してください。',
      })
    );
  });
});