import { listTeamsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-566: ページネーションパラメータが指定されない場合のデフォルト値適用', () => {
  it('pageNumberおよびpageSizeがnullの場合、デフォルト値を適用して検索結果を返す', async () => {
    const result = await listTeamsByCondition({
      teamIds: null,
      facilityIds: null,
      teamNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    });

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(Array.isArray(result.teams)).toBe(true);
    expect(result.teams.length).toBeLessThanOrEqual(50);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.teams.length);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('pageNumberおよびpageSizeがundefinedの場合、デフォルト値を適用して検索結果を返す', async () => {
    const result = await listTeamsByCondition({
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
    });

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(Array.isArray(result.teams)).toBe(true);
    expect(result.teams.length).toBeLessThanOrEqual(50);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.teams.length);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('ページネーションパラメータが未指定の場合、デフォルト値を適用して検索結果を返す', async () => {
    const result = await listTeamsByCondition({});

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(Array.isArray(result.teams)).toBe(true);
    expect(result.teams.length).toBeLessThanOrEqual(50);
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(result.teams.length);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('返却されるチーム情報が正しい構造を持つことを確認する', async () => {
    const result = await listTeamsByCondition({
      pageNumber: null,
      pageSize: null,
    });

    if (result.teams.length > 0) {
      const team = result.teams[0];
      expect(team).toHaveProperty('teamId');
      expect(team).toHaveProperty('teamName');
      expect(team).toHaveProperty('facilityId');
      expect(team).toHaveProperty('teamLeaderId');
      expect(team).toHaveProperty('operatingStatus');
      expect(team).toHaveProperty('capacity');
      expect(team).toHaveProperty('createdAt');
      expect(team).toHaveProperty('updatedAt');
      expect(team).toHaveProperty('createdBy');
      expect(typeof team.teamId).toBe('string');
      expect(typeof team.teamName).toBe('string');
      expect(typeof team.facilityId).toBe('string');
      expect(typeof team.teamLeaderId).toBe('string');
      expect(typeof team.operatingStatus).toBe('string');
      expect(typeof team.capacity).toBe('number');
      expect(typeof team.createdAt).toBe('string');
      expect(typeof team.updatedAt).toBe('string');
      expect(typeof team.createdBy).toBe('string');
    }
  });

  it('totalCountがページサイズに関わらず全体の件数を表すことを確認する', async () => {
    const result = await listTeamsByCondition({
      pageNumber: null,
      pageSize: null,
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.teams.length).toBeLessThanOrEqual(50);
    if (result.totalCount > 50) {
      expect(result.teams.length).toBe(50);
    }
  });

  it('retrievedAtがISO 8601形式で現在日時を示すことを確認する', async () => {
    const beforeTime = new Date();
    const result = await listTeamsByCondition({
      pageNumber: null,
      pageSize: null,
    });
    const afterTime = new Date();

    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    const retrievedTime = new Date(result.retrievedAt);
    expect(retrievedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(retrievedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
  });
});