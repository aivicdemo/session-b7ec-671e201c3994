import { saveProductivityData } from '../../src/logic/data-persistence';
import { SaveProductivityDataInput, SaveProductivityDataOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-946: 生産性データの更新保存と出力検証', () => {
  let validateReferentialIntegritySpy: jest.SpyInstance;
  let validateNumericQuantitySpy: jest.SpyInstance;
  let validateDateTimeRangeSpy: jest.SpyInstance;

  beforeEach(() => {
    // validateReferentialIntegrity のスタブ
    validateReferentialIntegritySpy = jest.spyOn(dataPersistence, 'validateReferentialIntegrity' as any).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    // validateNumericQuantity のスタブ
    validateNumericQuantitySpy = jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    // validateDateTimeRange のスタブ
    validateDateTimeRangeSpy = jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockResolvedValue({
      isValid: true,
      errors: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('保存後の出力に、入力された productivityDataId が反映される（更新時）', async () => {
    // 準備: 既存の生産性データをデータベースに保存する状態をモック
    const existingProductivityDataId = 'PROD-001';
    const mockExistingData = {
      productivityDataId: existingProductivityDataId,
      workResultId: 'WR-000',
      workerId: 'WKR-000',
      facilityId: 'FAC-000',
      teamId: 'TM-000',
      workDate: '2025-01-14',
      plannedWorkTime: 480,
      actualWorkTime: 480,
      completedItemCount: 90,
      productivityRate: 0.85,
      qualityScore: 0.92,
      errorCount: 2,
      proficiencyLevel: '初級',
      remarks: '初期実績',
      createdAt: '2025-01-14T10:00:00Z',
      updatedAt: '2025-01-14T10:00:00Z',
      createdBy: 'USR-001',
      updatedBy: null,
    };

    // 既存データをモックデータベースに設定
    const getProductivityDataByIdSpy = jest.spyOn(dataPersistence, 'getProductivityDataById' as any).mockResolvedValue(mockExistingData);

    // 更新入力を構築
    const updateInput: SaveProductivityDataInput = {
      productivityDataId: existingProductivityDataId,
      workResultId: 'WR-123',
      workerId: 'WKR-456',
      facilityId: 'FAC-789',
      teamId: 'TM-101',
      workDate: '2025-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 95,
      productivityRate: 0.9,
      qualityScore: 0.95,
      errorCount: 1,
      proficiencyLevel: '中級',
      remarks: '改善実績',
      createdBy: 'USR-001',
      updatedBy: 'USR-002',
    };

    // validateReferentialIntegrity スタブの期待値設定
    validateReferentialIntegritySpy.mockResolvedValueOnce({
      isValid: true,
      errors: [],
    });

    // validateNumericQuantity スタブの期待値設定
    validateNumericQuantitySpy.mockResolvedValueOnce({
      isValid: true,
      errors: [],
    });

    // validateDateTimeRange スタブの期待値設定
    validateDateTimeRangeSpy.mockResolvedValueOnce({
      isValid: true,
      errors: [],
    });

    // 実行
    const result = await saveProductivityData(updateInput);

    // 検証: validateReferentialIntegrity が呼ばれたことを確認
    expect(validateReferentialIntegritySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workResultId: 'WR-123',
        workerId: 'WKR-456',
        facilityId: 'FAC-789',
        teamId: 'TM-101',
      })
    );

    // 検証: validateNumericQuantity が呼ばれたことを確認
    expect(validateNumericQuantitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productivityRate: 0.9,
        qualityScore: 0.95,
        errorCount: 1,
      })
    );

    // 検証: validateDateTimeRange が呼ばれたことを確認
    expect(validateDateTimeRangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workDate: '2025-01-15',
      })
    );

    // 検証: productivityDataId が入力値と一致
    expect(result.productivityDataId).toBe('PROD-001');

    // 検証: 更新データが反映
    expect(result.workResultId).toBe('WR-123');
    expect(result.workerId).toBe('WKR-456');
    expect(result.facilityId).toBe('FAC-789');
    expect(result.teamId).toBe('TM-101');
    expect(result.workDate).toBe('2025-01-15');
    expect(result.productivityRate).toBe(0.9);
    expect(result.qualityScore).toBe(0.95);
    expect(result.errorCount).toBe(1);
    expect(result.proficiencyLevel).toBe('中級');

    // 検証: isNewRecord は false（更新であることを示す）
    expect(result.isNewRecord).toBe(false);

    // 検証: savedAt は ISO 8601形式
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/);

    // クリーンアップ
    getProductivityDataByIdSpy.mockRestore();
  });
});