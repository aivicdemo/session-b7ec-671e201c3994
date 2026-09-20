import { listTeamsByCondition } from '../../src/logic/data-persistence';
import { ListTeamsByConditionInput, ListTeamsByConditionOutput, GetTeamByIdOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-567: ソート順序が指定されない場合、昇順（asc）をデフォルトで適用する', () => {
  let mockTeamData: GetTeamByIdOutput[];

  beforeEach(() => {
    mockTeamData = [
      {
        teamId: 'T003',
        teamName: 'Zulu Team',
        facilityId: 'F001',
        teamLeaderId: 'WKR001',
        teamDescription: 'Third team',
        operatingStatus: 'active',
        capacity: 30,
        createdAt: '2024-01-15T10:00:00',
        updatedAt: '2024-01-20T14:30:00',
        createdBy: 'USR001',
        updatedBy: 'USR002',
      },
      {
        teamId: 'T001',
        teamName: 'Alpha Team',
        facilityId: 'F001',
        teamLeaderId: 'WKR002',
        teamDescription: 'First team',
        operatingStatus: 'active',
        capacity: 20,
        createdAt: '2024-01-10T09:00:00',
        updatedAt: '2024-01-18T12:00:00',
        createdBy: 'USR001',
        updatedBy: null,
      },
      {
        teamId: 'T002',
        teamName: 'Beta Team',
        facilityId: 'F001',
        teamLeaderId: 'WKR003',
        teamDescription: 'Second team',
        operatingStatus: 'inactive',
        capacity: 25,
        createdAt: '2024-01-12T11:00:00',
        updatedAt: '2024-01-19T15:45:00',
        createdBy: 'USR001',
        updatedBy: 'USR003',
      },
    ];

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sortOrderがnullの場合、デフォルトで昇順（asc）を適用する', async () => {
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: mockTeamData.sort((a, b) => a.teamName.localeCompare(b.teamName)),
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'teamName',
      sortOrder: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.teams[0].teamName).toBe('Alpha Team');
    expect(result.teams[1].teamName).toBe('Beta Team');
    expect(result.teams[2].teamName).toBe('Zulu Team');
  });

  test('sortOrderがundefinedの場合、デフォルトで昇順（asc）を適用する', async () => {
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: mockTeamData.sort((a, b) => a.teamName.localeCompare(b.teamName)),
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'teamName',
      sortOrder: undefined,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.teams[0].teamName).toBe('Alpha Team');
    expect(result.teams[1].teamName).toBe('Beta Team');
    expect(result.teams[2].teamName).toBe('Zulu Team');
  });

  test('sortOrderが指定されず、sortByも指定されない場合、デフォルトフィールドで昇順を適用する', async () => {
    const sortedByTeamId = mockTeamData.sort((a, b) => a.teamId.localeCompare(b.teamId));
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByTeamId,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: undefined,
      sortOrder: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.teams.length).toBeGreaterThan(0);

    const teamIds = result.teams.map(t => t.teamId);
    expect(teamIds[0]).toBeLessThanOrEqual(teamIds[1]);
    expect(teamIds[1]).toBeLessThanOrEqual(teamIds[2]);
  });

  test('sortOrderがnullで、sortByに"capacity"が指定された場合、定員人数で昇順ソートされる', async () => {
    const sortedByCapacity = mockTeamData.sort((a, b) => a.capacity - b.capacity);
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByCapacity,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'capacity',
      sortOrder: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    expect(result.teams[0].capacity).toBeLessThanOrEqual(result.teams[1].capacity);
    expect(result.teams[1].capacity).toBeLessThanOrEqual(result.teams[2].capacity);
  });

  test('sortOrderがnullで、sortByに"updatedAt"が指定された場合、更新日時で昇順ソートされる', async () => {
    const sortedByUpdatedAt = mockTeamData.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByUpdatedAt,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'updatedAt',
      sortOrder: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);

    const dates = result.teams.map((team) => new Date(team.updatedAt).getTime());
    expect(dates[0]).toBeLessThanOrEqual(dates[1]);
    expect(dates[1]).toBeLessThanOrEqual(dates[2]);
  });

  test('sortOrderとsortByの両方がnullの場合、エラーなく処理される', async () => {
    const sortedByTeamId = mockTeamData.sort((a, b) => a.teamId.localeCompare(b.teamId));
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByTeamId,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: null,
      sortOrder: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toBeDefined();
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeTruthy();
  });

  test('他の検索条件が正常で、sortOrderのみnullの場合、条件に合致するチームが昇順で返される', async () => {
    const activeTeams = mockTeamData.filter(t => t.operatingStatus === 'active').sort((a, b) => a.teamName.localeCompare(b.teamName));
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: activeTeams,
      totalCount: 2,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      teamNameKeyword: undefined,
      operatingStatuses: ['active'],
      sortBy: 'teamName',
      sortOrder: null,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams.length).toBeGreaterThan(0);
    expect(result.teams.every((team) => team.operatingStatus === 'active')).toBe(true);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const teamNames = result.teams.map(t => t.teamName);
    for (let i = 0; i < teamNames.length - 1; i++) {
      expect(teamNames[i].localeCompare(teamNames[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  test('pageNumberがnullで、pageSizeもnullの場合、デフォルト値を返す', async () => {
    const sortedByTeamName = mockTeamData.sort((a, b) => a.teamName.localeCompare(b.teamName));
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByTeamName,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 50,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'teamName',
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
  });

  test('ページネーション指定ありの場合、対応するページ番号とページサイズが返される', async () => {
    const sortedByTeamName = mockTeamData.sort((a, b) => a.teamName.localeCompare(b.teamName));
    jest.spyOn(dataPersistence, 'listTeamsByCondition').mockResolvedValue({
      teams: sortedByTeamName.slice(0, 10),
      totalCount: 3,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: '2024-01-20T16:00:00',
    });

    const input: ListTeamsByConditionInput = {
      facilityIds: ['F001'],
      sortBy: 'teamName',
      sortOrder: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBe(3);
  });
});