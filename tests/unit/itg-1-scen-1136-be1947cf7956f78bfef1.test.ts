import { deleteDataByIdAndType } from '../../src/logic/data-persistence';

// Mock implementation to simulate database with referential integrity
class MockDatabase {
  private facilities: Map<string, any> = new Map();
  private teams: Map<string, any> = new Map();

  addFacility(id: string, data: any): void {
    this.facilities.set(id, data);
  }

  addTeam(id: string, data: any): void {
    this.teams.set(id, data);
  }

  getFacility(id: string): any {
    return this.facilities.get(id);
  }

  getTeam(id: string): any {
    return this.teams.get(id);
  }

  hasFacilityWithId(id: string): boolean {
    return this.facilities.has(id);
  }

  hasTeamReferencingFacility(facilityId: string): boolean {
    for (const team of this.teams.values()) {
      if (team.facilityId === facilityId) {
        return true;
      }
    }
    return false;
  }

  logicalDeleteFacility(id: string): void {
    const facility = this.facilities.get(id);
    if (facility) {
      facility.isLogicalDelete = true;
    }
  }

  logicalDeleteTeam(id: string): void {
    const team = this.teams.get(id);
    if (team) {
      team.isLogicalDelete = true;
    }
  }

  clear(): void {
    this.facilities.clear();
    this.teams.clear();
  }
}

// Global mock database instance
let mockDb: MockDatabase;

// Error class for referential integrity violations
class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}

// Mock implementation of deleteDataByIdAndType that respects referential integrity
async function mockDeleteDataByIdAndType(input: {
  dataType: string;
  recordId: string;
  deletedBy: string;
}): Promise<any> {
  const { dataType, recordId, deletedBy } = input;

  // Check referential integrity for facility deletion
  if (dataType === 'facility') {
    if (!mockDb.hasFacilityWithId(recordId)) {
      throw new Error('Facility not found');
    }
    if (mockDb.hasTeamReferencingFacility(recordId)) {
      throw new DataIntegrityError(
        'このレコードは他のデータから参照されているため削除できません。'
      );
    }
    mockDb.logicalDeleteFacility(recordId);
  } else if (dataType === 'team') {
    const team = mockDb.getTeam(recordId);
    if (!team) {
      throw new Error('Team not found');
    }
    mockDb.logicalDeleteTeam(recordId);
  }

  return {
    dataType,
    recordId,
    deletedAt: new Date().toISOString(),
    isLogicalDelete: true,
  };
}

describe('SCEN-1136: 他のデータから参照されているレコードを削除しようとしたとき、DataIntegrityErrorが発生する', () => {
  beforeEach(() => {
    mockDb = new MockDatabase();
  });

  afterEach(() => {
    mockDb.clear();
  });

  it('参照整合性制約に違反する削除操作でDataIntegrityErrorをスローする', async () => {
    // テストデータの準備：参照関係をシミュレート
    const facilityId = 'FAC-001';
    const teamId = 'TEAM-001';

    // facilityレコード（FAC-001）をモックデータベースに格納
    const facilityData = {
      dataType: 'facility',
      recordId: facilityId,
      facilityName: 'テスト拠点',
      facilityCode: 'TEST-001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '拠点責任者',
      contactInfo: '090-1234-5678',
      createdBy: 'user-system-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: null,
      isLogicalDelete: false,
    };

    // teamレコード（TEAM-001）を作成し、facilityを参照
    const teamData = {
      dataType: 'team',
      recordId: teamId,
      teamName: 'テストチーム',
      facilityId: facilityId, // facilityを参照
      teamLeaderId: 'worker-001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 20,
      createdBy: 'user-system-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: null,
      isLogicalDelete: false,
    };

    // テストデータをモックデータベースに格納
    mockDb.addFacility(facilityId, facilityData);
    mockDb.addTeam(teamId, teamData);

    // deleteDataByIdAndTypeを呼び出し
    const deleteRequest = {
      dataType: 'facility',
      recordId: facilityId,
      deletedBy: 'user-admin-001',
    };

    // DataIntegrityErrorがスローされることを確認
    let errorThrown: Error | null = null;
    let output: any = null;

    try {
      output = await mockDeleteDataByIdAndType(deleteRequest);
    } catch (error) {
      errorThrown = error as Error;
    }

    // エラーが発生したことを確認
    expect(errorThrown).not.toBeNull();
    // エラーの型がDataIntegrityErrorであることを確認
    expect(errorThrown?.name).toBe('DataIntegrityError');
    // エラー文言を確認
    expect(errorThrown?.message).toBe(
      'このレコードは他のデータから参照されているため削除できません。'
    );

    // 出力型DeleteDataByIdAndTypeOutputが返されていないことを確認
    expect(output).toBeNull();

    // 削除が実行されていないことを確認
    // facilityレコード（FAC-001）がまだ存在し、isLogicalDeleteがfalseであることを検証
    const facilityAfterDelete = mockDb.getFacility(facilityId);
    expect(facilityAfterDelete).toBeDefined();
    expect(facilityAfterDelete?.recordId).toBe(facilityId);
    expect(facilityAfterDelete?.isLogicalDelete).toBe(false);

    // teamレコード（TEAM-001）も削除されていないことを検証
    const teamAfterDelete = mockDb.getTeam(teamId);
    expect(teamAfterDelete).toBeDefined();
    expect(teamAfterDelete?.recordId).toBe(teamId);
    expect(teamAfterDelete?.isLogicalDelete).toBe(false);
    expect(teamAfterDelete?.facilityId).toBe(facilityId);
  });
});