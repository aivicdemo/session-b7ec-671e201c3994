import { saveFacility, getFacilityById } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-508: 更新時にfacilityIdがnullでない既存拠点を指定すると、updatedByが保存される', () => {
  let createdFacilityId: string;

  beforeEach(async () => {
    // Arrange: 既存拠点データをデータベースに先行作成
    const existingFacilityInput = {
      facilityId: null,
      facilityName: '東京拠点A',
      facilityCode: 'FC-TOKYO-01',
      address: '東京都千代田区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active' as const,
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user001'
    };
    const createResult = await saveFacility(existingFacilityInput);
    createdFacilityId = createResult.facilityId;
  });

  it('should save updatedBy when updating existing facility with non-null facilityId', async () => {
    // Arrange: validateInputFormat と validateNumericQuantity をスタブ化
    const validateInputFormatSpy = jest.spyOn(dataPersistence, 'validateInputFormat' as any)
      .mockResolvedValue(true);
    const validateNumericQuantitySpy = jest.spyOn(dataPersistence, 'validateNumericQuantity' as any)
      .mockResolvedValue(true);
    
    // 入力データ（更新）
    const saveFacilityInput = {
      facilityId: createdFacilityId,
      facilityName: '東京拠点A-更新版',
      facilityCode: 'FC-TOKYO-01',
      address: '東京都千代田区丸の内',
      maxCapacity: 120,
      currentCapacity: 60,
      operatingStatus: 'active' as const,
      responsiblePersonName: '山田太郎',
      contactInfo: '090-1234-5679',
      createdBy: 'user001',
      updatedBy: 'user002'
    };

    // Act: saveFacility関数を呼び出す
    const result = await saveFacility(saveFacilityInput);

    // Assert: 出力値の検証
    expect(result).toBeDefined();
    expect(result.facilityId).toBe(createdFacilityId);
    expect(result.facilityCode).toBe('FC-TOKYO-01');
    expect(result.facilityName).toBe('東京拠点A-更新版');
    expect(result.isNewRecord).toBe(false);
    
    // savedAtが現在時刻であることを確認（ISO 8601形式）
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // validateInputFormat が呼ばれたことを確認
    expect(validateInputFormatSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityName: '東京拠点A-更新版',
        facilityCode: 'FC-TOKYO-01',
        address: '東京都千代田区丸の内',
        maxCapacity: 120
      })
    );

    // validateNumericQuantity が呼ばれたことを確認
    expect(validateNumericQuantitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        maxCapacity: 120,
        currentCapacity: 60
      })
    );

    // データベースに永続化されたデータの検証
    const persistedFacility = await getFacilityById({ facilityId: createdFacilityId });
    
    expect(persistedFacility).toBeDefined();
    expect(persistedFacility.facilityId).toBe(createdFacilityId);
    expect(persistedFacility.facilityCode).toBe('FC-TOKYO-01');
    expect(persistedFacility.facilityName).toBe('東京拠点A-更新版');
    expect(persistedFacility.address).toBe('東京都千代田区丸の内');
    expect(persistedFacility.maxCapacity).toBe(120);
    expect(persistedFacility.currentCapacity).toBe(60);
    expect(persistedFacility.updatedBy).toBe('user002');
    expect(persistedFacility.createdBy).toBe('user001');

    // cleanup
    validateInputFormatSpy.mockRestore();
    validateNumericQuantitySpy.mockRestore();
  });
});