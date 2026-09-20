import { saveFacility, SaveFacilityInput, SaveFacilityOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-502: 新規作成時に既存の拠点コードと同じコードを指定するとエラーが発生する', () => {
  const existingFacilityRecord = {
    facilityId: 'fac-existing-001',
    facilityCode: 'FC-001',
    facilityName: '既存拠点',
    address: '東京都千代田区',
    maxCapacity: 100,
    currentCapacity: 50,
    operatingStatus: 'active',
    responsiblePersonName: '佐藤次郎',
    contactInfo: '090-9876-5432',
    createdBy: 'user-admin',
    updatedBy: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // validateInputFormat をスタブ化: 入力値が有効と判定
    jest.spyOn(dataPersistence, 'validateInputFormat' as any).mockReturnValue(true);

    // validateNumericQuantity をスタブ化: 入力値が有効と判定
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockReturnValue(true);

    // テスト前提条件: 拠点コード 'FC-001' で既存の拠点レコードをデータベースに事前作成
    jest.spyOn(dataPersistence, 'getFacilityByCode' as any).mockResolvedValue(
      existingFacilityRecord
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw DuplicateFacilityCodeError when creating a new facility with an existing facility code', async () => {
    const persistSpy = jest.spyOn(dataPersistence, 'persistFacilityRecord' as any).mockResolvedValue(null);

    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: '新規拠点',
      facilityCode: 'FC-001',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 30,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user-001',
    };

    let thrownError: Error | null = null;

    try {
      await saveFacility(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('DuplicateFacilityCodeError');
    expect(thrownError?.message).toBe('この拠点コードは既に使用されています。');
    expect(persistSpy).not.toHaveBeenCalled();
  });

  it('should allow creating new facility when code is unique', async () => {
    jest.spyOn(dataPersistence, 'getFacilityByCode' as any).mockResolvedValue(null);

    jest.spyOn(dataPersistence, 'persistFacilityRecord' as any).mockResolvedValue({
      facilityId: 'fac-new-001',
      facilityCode: 'FC-002',
      facilityName: '新規拠点',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 30,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user-001',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    });

    const input: SaveFacilityInput = {
      facilityId: null,
      facilityName: '新規拠点',
      facilityCode: 'FC-002',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 30,
      operatingStatus: 'active',
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user-001',
    };

    const result = await saveFacility(input);

    expect(result).toBeDefined();
    expect(result?.isNewRecord).toBe(true);
    expect(result?.facilityCode).toBe('FC-002');
  });
});