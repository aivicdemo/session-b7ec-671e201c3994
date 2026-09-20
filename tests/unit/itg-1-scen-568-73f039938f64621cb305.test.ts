import { listTeamsByCondition } from '../../src/logic/data-persistence';
import { GetTeamByIdOutput, ListTeamsByConditionInput, ListTeamsByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-568: listTeamsByCondition - 複数検索条件の組み合わせ', () => {
  let mockTeams: GetTeamByIdOutput[];

  beforeEach(() => {
    mockTeams = [
      {
        teamId: 'TEAM-001',
        teamName: 'ピッキングチームA',
        facilityId: 'FAC-01',
        teamLeaderId: 'LEADER-001',
        teamDescription: 'Picking team A',
        operatingStatus: 'active',
        capacity: 10,
        createdAt: '2024-01-15T10:00:00',
        updatedAt: '2024-01-20T14:30:00',
        createdBy: 'USER-001',
        updatedBy: 'USER-002',
      },
      {
        teamId: 'TEAM-002',
        teamName: 'パッキングチームB',
        facilityId: 'FAC-01',
        teamLeaderId: 'LEADER-002',
        teamDescription: 'Packing team B',
        operatingStatus: 'active',
        capacity: 8,
        createdAt: '2024-01-16T09:00:00',
        updatedAt: '2024-01-21T11:00:00',
        createdBy: 'USER-001',
        updatedBy: 'USER-002',
      },
      {
        teamId: 'TEAM-003',
        teamName: 'ピッキングチームC',
        facilityId: 'FAC-02',
        teamLeaderId: 'LEADER-003',
        teamDescription: 'Picking team C',
        operatingStatus: 'inactive',
        capacity: 12,
        createdAt: '2024-01-17T08:00:00',
        updatedAt: '2024-01-19T16:00:00',
        createdBy: 'USER-001',
        updatedBy: 'USER-002',
      },
      {
        teamId: 'TEAM-004',
        teamName: 'シップチームD',
        facilityId: 'FAC-02',
        teamLeaderId: 'LEADER-004',
        teamDescription: 'Ship team D',
        operatingStatus: 'active',
        capacity: 15,
        createdAt: '2024-01-14T11:00:00',
        updatedAt: '2024-01-22T13:00:00',
        createdBy: 'USER-001',
        updatedBy: 'USER-002',
      },
    ];
  });

  it('指定された複数の検索条件に合致するチーム情報のみを返す', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['TEAM-001', 'TEAM-002'],
      facilityIds: ['FAC-01'],
      teamNameKeyword: 'ピッキング',
      operatingStatuses: ['active'],
      minCapacity: 8,
      maxCapacity: 15,
      createdFromDate: '2024-01-15T00:00:00',
      createdToDate: '2024-01-20T23:59:59',
      updatedFromDate: '2024-01-20T00:00:00',
      updatedToDate: '2024-01-22T23:59:59',
      sortBy: 'teamName',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListTeamsByConditionOutput = await listTeamsByCondition(input);

    expect(result).toBeDefined();
    expect(result.teams).toBeDefined();
    expect(Array.isArray(result.teams)).toBe(true);

    expect(result.teams).toHaveLength(1);

    const expectedTeam = {
      teamId: 'TEAM-001',
      teamName: 'ピッキングチームA',
      facilityId: 'FAC-01',
      teamLeaderId: 'LEADER-001',
      teamDescription: 'Picking team A',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-20T14:30:00',
      createdBy: 'USER-001',
      updatedBy: 'USER-002',
    };

    expect(result.teams[0]).toMatchObject({
      teamId: expectedTeam.teamId,
      teamName: expectedTeam.teamName,
      facilityId: expectedTeam.facilityId,
      teamLeaderId: expectedTeam.teamLeaderId,
      operatingStatus: expectedTeam.operatingStatus,
      capacity: expectedTeam.capacity,
    });

    expect(result.totalCount).toBe(1);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();

    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate).toBeInstanceOf(Date);
    expect(retrievedAtDate.getTime()).not.toBeNaN();
  });

  it('条件評価：teamIdフィルタリングが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['TEAM-001', 'TEAM-002'],
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    const teamIds = result.teams.map((t) => t.teamId);
    expect(teamIds).toEqual(expect.arrayContaining(['TEAM-001', 'TEAM-002']));
    expect(teamIds).not.toContain('TEAM-003');
    expect(teamIds).not.toContain('TEAM-004');
  });

  it('条件評価：facilityIdフィルタリングが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      facilityIds: ['FAC-01'],
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      expect(team.facilityId).toBe('FAC-01');
    });
  });

  it('条件評価：teamNameKeywordが部分一致で正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      teamNameKeyword: 'ピッキング',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      expect(team.teamName).toContain('ピッキング');
    });
  });

  it('条件評価：operatingStatusフィルタリングが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      operatingStatuses: ['active'],
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      expect(team.operatingStatus).toBe('active');
    });
  });

  it('条件評価：capacityの最小値フィルタリングが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      minCapacity: 10,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      expect(team.capacity).toBeGreaterThanOrEqual(10);
    });
  });

  it('条件評価：capacityの最大値フィルタリングが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      maxCapacity: 12,
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      expect(team.capacity).toBeLessThanOrEqual(12);
    });
  });

  it('条件評価：createdFromDate以降のレコードが返される', async () => {
    const input: ListTeamsByConditionInput = {
      createdFromDate: '2024-01-16T00:00:00',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      const teamCreatedAt = new Date(team.createdAt);
      const filterDate = new Date('2024-01-16T00:00:00');
      expect(teamCreatedAt.getTime()).toBeGreaterThanOrEqual(filterDate.getTime());
    });
  });

  it('条件評価：createdToDate以前のレコードが返される', async () => {
    const input: ListTeamsByConditionInput = {
      createdToDate: '2024-01-16T23:59:59',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      const teamCreatedAt = new Date(team.createdAt);
      const filterDate = new Date('2024-01-16T23:59:59');
      expect(teamCreatedAt.getTime()).toBeLessThanOrEqual(filterDate.getTime());
    });
  });

  it('条件評価：updatedFromDate以降のレコードが返される', async () => {
    const input: ListTeamsByConditionInput = {
      updatedFromDate: '2024-01-20T00:00:00',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      const teamUpdatedAt = new Date(team.updatedAt);
      const filterDate = new Date('2024-01-20T00:00:00');
      expect(teamUpdatedAt.getTime()).toBeGreaterThanOrEqual(filterDate.getTime());
    });
  });

  it('条件評価：updatedToDate以前のレコードが返される', async () => {
    const input: ListTeamsByConditionInput = {
      updatedToDate: '2024-01-22T23:59:59',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    result.teams.forEach((team) => {
      const teamUpdatedAt = new Date(team.updatedAt);
      const filterDate = new Date('2024-01-22T23:59:59');
      expect(teamUpdatedAt.getTime()).toBeLessThanOrEqual(filterDate.getTime());
    });
  });

  it('条件評価：sortByとsortOrderで結果がソートされる', async () => {
    const input: ListTeamsByConditionInput = {
      sortBy: 'teamName',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    const teamNames = result.teams.map((t) => t.teamName);
    const sortedTeamNames = [...teamNames].sort();
    expect(teamNames).toEqual(sortedTeamNames);
  });

  it('条件評価：ページネーションが正しく機能する', async () => {
    const input: ListTeamsByConditionInput = {
      pageNumber: 1,
      pageSize: 2,
    };

    const result = await listTeamsByCondition(input);

    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.teams.length).toBeLessThanOrEqual(2);
  });

  it('複数条件を組み合わせた場合、すべての条件を満たすレコードのみが返される', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['TEAM-001', 'TEAM-002', 'TEAM-003', 'TEAM-004'],
      facilityIds: ['FAC-01'],
      teamNameKeyword: 'ピッキング',
      operatingStatuses: ['active'],
      minCapacity: 8,
      maxCapacity: 15,
      createdFromDate: '2024-01-15T00:00:00',
      createdToDate: '2024-01-20T23:59:59',
      updatedFromDate: '2024-01-20T00:00:00',
      updatedToDate: '2024-01-22T23:59:59',
      sortBy: 'teamName',
      sortOrder: 'asc',
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    expect(result.teams.length).toBeGreaterThan(0);

    result.teams.forEach((team) => {
      expect(['TEAM-001', 'TEAM-002', 'TEAM-003', 'TEAM-004']).toContain(team.teamId);
      expect(team.facilityId).toBe('FAC-01');
      expect(team.teamName).toContain('ピッキング');
      expect(team.operatingStatus).toBe('active');
      expect(team.capacity).toBeGreaterThanOrEqual(8);
      expect(team.capacity).toBeLessThanOrEqual(15);

      const createdAt = new Date(team.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-15T00:00:00').getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(new Date('2024-01-20T23:59:59').getTime());

      const updatedAt = new Date(team.updatedAt);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-20T00:00:00').getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(new Date('2024-01-22T23:59:59').getTime());
    });
  });

  it('該当するレコードが存在しない場合、空配列を返す', async () => {
    const input: ListTeamsByConditionInput = {
      teamIds: ['TEAM-999'],
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    expect(result.teams).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('retrievedAtが現在時刻に近い値で返される', async () => {
    const beforeCall = new Date();
    const input: ListTeamsByConditionInput = {
      pageNumber: 1,
      pageSize: 50,
    };

    const result = await listTeamsByCondition(input);

    const afterCall = new Date();
    const retrievedAtDate = new Date(result.retrievedAt);

    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
  });
});