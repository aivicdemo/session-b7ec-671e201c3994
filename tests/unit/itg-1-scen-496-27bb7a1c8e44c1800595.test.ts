import { saveFacility } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-496: 拠点マスタデータ更新', () => {
  it('既存拠点のIDを指定して更新し、新規作成フラグがfalseで保存される', async () => {
    // 既存拠点をデータベースから取得して存在確認
    const existingFacilityId = 'facility-existing-001';
    
    // 実際のデータベースから既存拠点の存在を確認
    let confirmedFacilityId: string | null = null;
    try {
      const existingFacility = await dataPersistence.getFacilityById({
        facilityId: existingFacilityId,
      });
      if (existingFacility) {
        confirmedFacilityId = existingFacility.facilityId;
      }
    } catch (error) {
      // 既存拠点がない場合は事前に作成
      const createResult = await saveFacility({
        facilityId: null,
        facilityName: '仮拠点',
        facilityCode: 'TEMP-001',
        address: '東京都',
        maxCapacity: 100,
        currentCapacity: 0,
        operatingStatus: 'active',
        responsiblePersonName: '仮管理者',
        contactInfo: '00-0000-0000',
        createdBy: 'system-setup',
      });
      confirmedFacilityId = createResult.facilityId;
    }

    expect(confirmedFacilityId).toBeDefined();

    // validateInputFormatをスタブ化
    const validateInputFormatStub = jest
      .spyOn(dataPersistence as any, 'validateInputFormat')
      .mockResolvedValue({ valid: true });

    // validateNumericQuantityをスタブ化
    const validateNumericQuantityStub = jest
      .spyOn(dataPersistence as any, 'validateNumericQuantity')
      .mockResolvedValue({ valid: true });

    // SaveFacilityInputの構成
    const input = {
      facilityId: confirmedFacilityId,
      facilityName: '東京物流センター',
      facilityCode: 'TYO-001',
      address: '東京都江東区',
      maxCapacity: 50,
      currentCapacity: 30,
      operatingStatus: 'active' as const,
      responsiblePersonName: '田中太郎',
      contactInfo: '090-1234-5678',
      updatedBy: 'user-update-001',
    };

    // saveFacilityを呼び出す
    const result = await saveFacility(input);

    // SaveFacilityOutputの検証
    expect(result).toBeDefined();
    expect(result.facilityId).toBe(confirmedFacilityId);
    expect(result.facilityCode).toBe('TYO-001');
    expect(result.facilityName).toBe('東京物流センター');
    expect(result.isNewRecord).toBe(false);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // スタブをクリア
    validateInputFormatStub.mockRestore();
    validateNumericQuantityStub.mockRestore();
  });
});