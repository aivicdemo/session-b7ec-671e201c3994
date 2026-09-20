import { saveProductivityData } from '../../src/logic/data-persistence';
import { ProductivityMetricsCalculationError } from '../../src/logic/errors';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    validateNumericQuantity: jest.fn(),
    validateReferentialIntegrity: jest.fn(),
    validateDateTimeRange: jest.fn(),
  };
});

describe('SCEN-940: 生産性率の計算時にゼロ除算が発生する場合の処理', () => {
  let validateNumericQuantity: jest.Mock;
  let validateReferentialIntegrity: jest.Mock;
  let validateDateTimeRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    validateNumericQuantity = dataPersistence.validateNumericQuantity as jest.Mock;
    validateReferentialIntegrity = dataPersistence.validateReferentialIntegrity as jest.Mock;
    validateDateTimeRange = dataPersistence.validateDateTimeRange as jest.Mock;
  });

  it('plannedWorkTime=0のときにProductivityMetricsCalculationErrorが発生し、ゼロ除算が原因である', async () => {
    // 手順1: スタブ validateNumericQuantity をエラー条件で設定: plannedWorkTime=0によるゼロ除算をシミュレート
    validateNumericQuantity.mockImplementation((value: number, fieldName: string) => {
      if (fieldName === 'plannedWorkTime' && value === 0) {
        throw new ProductivityMetricsCalculationError(
          '生産性指標の計算に失敗しました。入力データを確認してください。',
          'ZERO_DIVISION_ERROR'
        );
      }
      return true;
    });

    // 手順3: スタブ validateReferentialIntegrity を正常系で設定
    validateReferentialIntegrity.mockReturnValue(true);

    // 手順4: スタブ validateDateTimeRange を正常系で設定
    validateDateTimeRange.mockReturnValue(true);

    // 手順2: saveProductivityData に以下の入力を与える
    const input = {
      productivityDataId: null,
      workResultId: 'WR-001',
      workerId: 'W-001',
      facilityId: 'F-001',
      teamId: 'T-001',
      workDate: '2024-01-15',
      plannedWorkTime: 0,
      actualWorkTime: 480,
      completedItemCount: 100,
      productivityRate: NaN,
      qualityScore: 0.95,
      errorCount: 2,
      proficiencyLevel: '中級',
      remarks: null,
      createdBy: 'U-001',
      updatedBy: null,
    };

    let thrownError: Error | null = null;

    // 手順5: saveProductivityData の呼び出しを実行する
    try {
      await saveProductivityData(input);
      fail('ProductivityMetricsCalculationError が発生すべき');
    } catch (error) {
      thrownError = error as Error;
    }

    // 手順6: 戻り値の型と内容を検証する
    // ProductivityMetricsCalculationError エラーが発生していることを確認
    expect(thrownError).toBeInstanceOf(ProductivityMetricsCalculationError);
    expect(thrownError).toBeInstanceOf(Error);
    
    // エラーメッセージが期待値と一致していることを確認
    expect(thrownError.message).toBe(
      '生産性指標の計算に失敗しました。入力データを確認してください。'
    );
    
    // ゼロ除算が原因であることを確認
    expect((thrownError as ProductivityMetricsCalculationError).code).toBe('ZERO_DIVISION_ERROR');
    
    // SaveProductivityDataOutput 型ではなくエラーオブジェクトであることを確認
    expect((thrownError as any).productivityDataId).toBeUndefined();
    expect((thrownError as any).workResultId).toBeUndefined();
    expect((thrownError as any).savedAt).toBeUndefined();
    expect((thrownError as any).isNewRecord).toBeUndefined();
    
    // エラーが確実に発生したことを検証
    expect(thrownError).not.toBeNull();
  });
});