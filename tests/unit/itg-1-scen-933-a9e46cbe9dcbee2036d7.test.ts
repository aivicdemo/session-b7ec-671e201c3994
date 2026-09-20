import {
  saveProductivityData,
  SaveProductivityDataInput,
  SaveProductivityDataOutput,
} from '../../src/logic/data-persistence';
import * as validationCommonCalculation from '../../src/logic/validation-common-calculation';

jest.mock('../../src/logic/validation-common-calculation');

describe('SCEN-933: 生産性データの新規保存（updatedByがnull/undefined時）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updatedByがnull または undefinedの場合も、他の必須フィールドが全て揃っていれば正常に保存される', async () => {
    // Arrange: validateNumericQuantityをスタブ化
    (
      validationCommonCalculation.validateNumericQuantity as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: validateReferentialIntegrityをスタブ化
    (
      validationCommonCalculation.validateReferentialIntegrity as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: validateDateTimeRangeをスタブ化
    (
      validationCommonCalculation.validateDateTimeRange as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: SaveProductivityDataInputを作成
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'WKR-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workDate: '2025-01-15T09:00:00Z',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9375,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'ADMIN-001',
      updatedBy: null,
    };

    // Act: saveProductivityDataを呼び出し
    const result: SaveProductivityDataOutput =
      await saveProductivityData(input);

    // Assert: 戻り値を検証
    // (1) productivityDataIdが新規に生成された文字列値である
    expect(result.productivityDataId).toBeDefined();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.productivityDataId).toBeTruthy();

    // (2) workResultId、workerId、facilityId、teamIdが出力に含まれる
    expect(result.workResultId).toBe('WR-001');
    expect(result.workerId).toBe('WKR-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');

    // (3) workDate、productivityRate、qualityScore、errorCount、proficiencyLevelがそのまま保存されている
    expect(result.workDate).toBe('2025-01-15T09:00:00Z');
    expect(result.productivityRate).toBe(0.9375);
    expect(result.qualityScore).toBe(0.95);
    expect(result.errorCount).toBe(2);
    expect(result.proficiencyLevel).toBe('中級');

    // (4) savedAtがISO 8601形式の現在日時またはそれに近い値である
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    // ISO 8601形式であることを簡易的に確認
    expect(result.savedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // (5) isNewRecord=trueである
    expect(result.isNewRecord).toBe(true);
  });

  it('updatedByがundefinedの場合も同様に正常に保存される', async () => {
    // Arrange: validateNumericQuantityをスタブ化
    (
      validationCommonCalculation.validateNumericQuantity as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: validateReferentialIntegrityをスタブ化
    (
      validationCommonCalculation.validateReferentialIntegrity as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: validateDateTimeRangeをスタブ化
    (
      validationCommonCalculation.validateDateTimeRange as jest.Mock
    ).mockReturnValue({
      isValid: true,
      errors: [],
    });

    // Arrange: SaveProductivityDataInputを作成（updatedByを明示的に指定しない）
    const input: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR-002',
      workerId: 'WKR-002',
      facilityId: 'FAC-002',
      teamId: 'TEAM-002',
      workDate: '2025-01-16T10:00:00Z',
      plannedWorkTime: 480,
      actualWorkTime: 460,
      completedItemCount: 110,
      productivityRate: 0.958,
      qualityScore: 0.98,
      errorCount: 1,
      proficiencyLevel: '上級',
      createdBy: 'ADMIN-002',
    };

    // Act: saveProductivityDataを呼び出し
    const result: SaveProductivityDataOutput =
      await saveProductivityData(input);

    // Assert: 戻り値を検証
    expect(result.productivityDataId).toBeDefined();
    expect(typeof result.productivityDataId).toBe('string');
    expect(result.workResultId).toBe('WR-002');
    expect(result.workerId).toBe('WKR-002');
    expect(result.facilityId).toBe('FAC-002');
    expect(result.teamId).toBe('TEAM-002');
    expect(result.workDate).toBe('2025-01-16T10:00:00Z');
    expect(result.productivityRate).toBe(0.958);
    expect(result.qualityScore).toBe(0.98);
    expect(result.errorCount).toBe(1);
    expect(result.proficiencyLevel).toBe('上級');
    expect(result.savedAt).toBeDefined();
    expect(result.isNewRecord).toBe(true);
  });
});