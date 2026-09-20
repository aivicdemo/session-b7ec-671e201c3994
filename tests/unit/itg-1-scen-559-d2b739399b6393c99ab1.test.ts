import { listTeamsByCondition } from '../../src/logic/data-persistence';
import type { ListTeamsByConditionInput, ListTeamsByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-559: listTeamsByCondition - 代表的な正常入力で検索条件に合致するチーム情報一覧を取得', () => {
  it('should return team list matching search conditions with pagination info', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['TEAM001', 'TEAM002'],
      facilityIds: ['FAC-A'],
      teamNameKeyword: '営業',
      operatingStatuses: ['active'],
      minCapacity: 5,
      maxCapacity: 20,
      createdFromDate: '2024-01-01T00:00:00',
      createdToDate: '2024-12-31T23:59:59',
      updatedFromDate: '2024-06-01T00:00:00',
      updatedToDate: '2024-12-31T23:59:59',
      sortBy: 'teamName',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();

    expect(Array.isArray(result.teams)).toBe(true);
    result.teams.forEach((team) => {
      expect(team.teamId).toBeDefined();
      expect(team.teamName).toBeDefined();
      expect(team.facilityId).toBeDefined();
      expect(team.operatingStatus).toBeDefined();
      expect(team.capacity).toBeDefined();
      expect(team.createdAt).toBeDefined();
      expect(team.updatedAt).toBeDefined();
      expect(team.createdBy).toBeDefined();
      
      if (input.teamIds && input.teamIds.length > 0) {
        expect(input.teamIds).toContain(team.teamId);
      }
      if (input.facilityIds && input.facilityIds.length > 0) {
        expect(input.facilityIds).toContain(team.facilityId);
      }
      if (input.teamNameKeyword) {
        expect(team.teamName.toUpperCase()).toContain(input.teamNameKeyword.toUpperCase());
      }
      if (input.operatingStatuses && input.operatingStatuses.length > 0) {
        expect(input.operatingStatuses).toContain(team.operatingStatus);
      }
      if (input.minCapacity !== undefined && input.minCapacity !== null) {
        expect(team.capacity).toBeGreaterThanOrEqual(input.minCapacity);
      }
      if (input.maxCapacity !== undefined && input.maxCapacity !== null) {
        expect(team.capacity).toBeLessThanOrEqual(input.maxCapacity);
      }
      if (input.createdFromDate) {
        expect(new Date(team.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(input.createdFromDate).getTime());
      }
      if (input.createdToDate) {
        expect(new Date(team.createdAt).getTime()).toBeLessThanOrEqual(new Date(input.createdToDate).getTime());
      }
      if (input.updatedFromDate) {
        expect(new Date(team.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(input.updatedFromDate).getTime());
      }
      if (input.updatedToDate) {
        expect(new Date(team.updatedAt).getTime()).toBeLessThanOrEqual(new Date(input.updatedToDate).getTime());
      }
    });

    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    expect(result.pageNumber).toBe(1);

    expect(result.pageSize).toBe(50);

    expect(typeof result.retrievedAt).toBe('string');
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
    expect(result.retrievedAt).toMatch(isoPattern);
  });
});