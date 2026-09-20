import { deleteDataByConditionAndType } from '../../src/logic/data-persistence';

describe('SCEN-1145: 複数のレコードが検索条件に合致する場合、すべてのマッチレコードが論理削除されて削除件数に反映される', () => {
  const mockDb = {
    facility: [] as any[],
  };

  const testDataType = 'facility';
  const testUserId = 'user-123';
  const testRecords = [
    {
      id: 'facility-1',
      facilityName: 'Facility A',
      facilityCode: 'FAC001',
      address: 'Address 1',
      operatingStatus: 'active',
      region: 'region-X',
      logicalDeleteFlag: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'facility-2',
      facilityName: 'Facility B',
      facilityCode: 'FAC002',
      address: 'Address 2',
      operatingStatus: 'active',
      region: 'region-X',
      logicalDeleteFlag: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'facility-3',
      facilityName: 'Facility C',
      facilityCode: 'FAC003',
      address: 'Address 3',
      operatingStatus: 'active',
      region: 'region-X',
      logicalDeleteFlag: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const filterCondition = {
    operatingStatus: 'active',
    region: 'region-X',
  };

  beforeEach(() => {
    mockDb.facility = JSON.parse(JSON.stringify(testRecords));
  });

  it('should logically delete all matching records and return deleted count', async () => {
    // ステップ1: テストデータをデータベースに挿入
    expect(mockDb.facility).toHaveLength(3);
    mockDb.facility.forEach((record) => {
      expect(record.logicalDeleteFlag).toBe(false);
      expect(record.deletedAt).toBeNull();
    });

    // ステップ2: filterCondition に合致するレコードが3件存在することを確認（複数条件の組み合わせ）
    const matchingRecords = mockDb.facility.filter(
      (r) => r.operatingStatus === filterCondition.operatingStatus && r.region === filterCondition.region
    );
    expect(matchingRecords).toHaveLength(3);

    // ステップ3-5: スタブ化とモック設定
    const authorizeOperationMock = jest.fn().mockResolvedValue(true);
    const validateReferentialIntegrityMock = jest
      .fn()
      .mockResolvedValue(true);
    const recordOperationAuditMock = jest.fn().mockResolvedValue(true);

    // ステップ6: deleteDataByConditionAndType を呼び出す
    const beforeCallTime = new Date();
    const result = await deleteDataByConditionAndType(
      {
        dataType: testDataType,
        filterCondition,
        deletedBy: testUserId,
      },
      {
        authorizeOperation: authorizeOperationMock,
        validateReferentialIntegrity: validateReferentialIntegrityMock,
        recordOperationAudit: recordOperationAuditMock,
        queryDatabase: jest.fn().mockResolvedValue(mockDb.facility),
        updateDatabase: jest
          .fn()
          .mockImplementation(async (updates) => {
            mockDb.facility = mockDb.facility.map((record) =>
              updates.find((u: any) => u.id === record.id)
                ? {
                    ...record,
                    logicalDeleteFlag: true,
                    deletedAt: updates.find(
                      (u: any) => u.id === record.id
                    ).deletedAt,
                  }
                : record
            );
            return true;
          }),
      }
    );
    const afterCallTime = new Date();

    // ステップ7: 戻り値の出力型フィールドを検証
    expect(result).toBeDefined();
    expect(result.dataType).toBe(testDataType);
    expect(result.deletedRecordCount).toBe(3);
    expect(result.isLogicalDelete).toBe(true);
    expect(result.deletedAt).toBeDefined();

    // deletedAtがISO 8601形式であること
    const deletedAtDate = new Date(result.deletedAt);
    expect(deletedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCallTime.getTime());
    expect(deletedAtDate.getTime()).toBeLessThanOrEqual(afterCallTime.getTime());

    // ステップ8: 削除後のデータベース状態を確認
    const updatedRecords = mockDb.facility;
    expect(updatedRecords).toHaveLength(3);
    updatedRecords.forEach((record) => {
      expect(record.logicalDeleteFlag).toBe(true);
      expect(record.deletedAt).toBeDefined();
      expect(typeof record.deletedAt).toBe('string');
    });

    // 監査ログに削除実行ユーザーが記録されていることを確認
    expect(recordOperationAuditMock).toHaveBeenCalled();
    const auditCallArgs = recordOperationAuditMock.mock.calls[0];
    expect(auditCallArgs).toBeDefined();
    expect(auditCallArgs[0]).toContain(testUserId);
  });

  it('should verify that only matching records are deleted', async () => {
    // 追加のレコードをデータベースに挿入（別の region）
    const nonMatchingRecord = {
      id: 'facility-4',
      facilityName: 'Facility D',
      facilityCode: 'FAC004',
      address: 'Address 4',
      operatingStatus: 'active',
      region: 'region-Y',
      logicalDeleteFlag: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.facility.push(nonMatchingRecord);

    expect(mockDb.facility).toHaveLength(4);

    const authorizeOperationMock = jest.fn().mockResolvedValue(true);
    const validateReferentialIntegrityMock = jest
      .fn()
      .mockResolvedValue(true);
    const recordOperationAuditMock = jest.fn().mockResolvedValue(true);

    const result = await deleteDataByConditionAndType(
      {
        dataType: testDataType,
        filterCondition,
        deletedBy: testUserId,
      },
      {
        authorizeOperation: authorizeOperationMock,
        validateReferentialIntegrity: validateReferentialIntegrityMock,
        recordOperationAudit: recordOperationAuditMock,
        queryDatabase: jest.fn().mockResolvedValue(mockDb.facility),
        updateDatabase: jest
          .fn()
          .mockImplementation(async (updates) => {
            mockDb.facility = mockDb.facility.map((record) =>
              updates.find((u: any) => u.id === record.id)
                ? {
                    ...record,
                    logicalDeleteFlag: true,
                    deletedAt: updates.find(
                      (u: any) => u.id === record.id
                    ).deletedAt,
                  }
                : record
            );
            return true;
          }),
      }
    );

    // 削除件数は3件であること（マッチしたレコードのみ）
    expect(result.deletedRecordCount).toBe(3);
    expect(result.isLogicalDelete).toBe(true);

    // マッチしないレコード（facility-4）は削除されていないこと
    const nonDeletedRecord = mockDb.facility.find((r) => r.id === 'facility-4');
    expect(nonDeletedRecord).toBeDefined();
    expect(nonDeletedRecord!.logicalDeleteFlag).toBe(false);
    expect(nonDeletedRecord!.deletedAt).toBeNull();

    // マッチしたレコードはすべて削除されていること
    const deletedRecords = mockDb.facility.filter(
      (r) => r.operatingStatus === 'active' && r.region === 'region-X'
    );
    deletedRecords.forEach((record) => {
      expect(record.logicalDeleteFlag).toBe(true);
      expect(record.deletedAt).toBeDefined();
    });

    // 監査ログに削除実行ユーザーが記録されていることを確認
    expect(recordOperationAuditMock).toHaveBeenCalled();
    const auditCallArgs = recordOperationAuditMock.mock.calls[0];
    expect(auditCallArgs).toBeDefined();
    expect(auditCallArgs[0]).toContain(testUserId);
  });
});