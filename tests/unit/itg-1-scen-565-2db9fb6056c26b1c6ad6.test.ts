import { listTeamsByCondition } from '../../src/logic/data-persistence';
import { ListTeamsByConditionInput } from '../../src/logic/data-persistence';

describe('SCEN-565: listTeamsByCondition with no matching results', () => {
  it('should throw NoResultsError when no teams match the search conditions', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });

  it('should throw NoResultsError when search conditions result in empty result set', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['non-existent-team-id-12345'],
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });

  it('should throw NoResultsError with specific team name keyword that matches nothing', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: 'このキーワードに合致するチームは存在しません',
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });

  it('should throw NoResultsError when filtering by non-existent operating status', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: ['存在しない稼働状況'],
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });

  it('should throw NoResultsError when capacity range filters result in no matches', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: 100000,
      maxCapacity: 200000,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });

  it('should throw NoResultsError when date range filters result in no matches', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: undefined,
      facilityIds: undefined,
      teamNameKeyword: undefined,
      operatingStatuses: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      createdFromDate: '2050-01-01T00:00:00Z',
      createdToDate: '2051-12-31T23:59:59Z',
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    await expect(listTeamsByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'NoResultsError',
        message: '指定された条件に合致するチーム情報は見つかりません。',
      })
    );
  });
});