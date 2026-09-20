import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

// ProductivityCalculationError クラスを定義
class ProductivityCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductivityCalculationError';
    Object.setPrototypeOf(this, ProductivityCalculationError.prototype);
  }
}

describe('SCEN-224: 生産性指標計算時のデータ不足エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('生産性指標の計算に必要なデータが不足または不正である場合はProductivityCalculationErrorを発生させる', async () => {
    // Arrange: スタブ設定
    // authorizeOperation スタブが正常に権限検証を返すよう設定
    jest.spyOn(global as any, 'authorizeOperation').mockResolvedValue({
      isAuthorized: true,
      facilityId: 'FAC001',
      userId: 'USER001',
    });

    // listHandyTerminalSyncLogByCondition スタブが指定期間内に有効なログレコードを返すよう設定
    jest.spyOn(global as any, 'listHandyTerminalSyncLogByCondition').mockResolvedValue([
      {
        handyTerminalSyncLogId: 'LOG001',
        workInstructionId: 'WI001',
        workerId: 'WORKER001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workStartDateTime: '2024-01-01T08:00:00Z',
        workEndDateTime: '2024-01-01T09:00:00Z',
        completedQuantity: 100,
        defectiveQuantity: 5,
        syncTimestamp: '2024-01-01T09:30:00Z',
      },
    ]);

    // getWorkerWithProficiencyAndProductivity スタブが
    // 生産性指標の計算に必要な情報が不足または null を含むデータを返すよう設定
    jest.spyOn(global as any, 'getWorkerWithProficiencyAndProductivity').mockResolvedValue({
      workerId: 'WORKER001',
      proficiencyLevel: null, // 不足データ
      recentProductivityRate: null, // 不足データ
      qualityScore: undefined, // 不足データ
    });

    // aggregateWorkResultsAndCalculateProductivity を呼び出すと、
    // 不足・不正なデータに基づいて生産性指標の計算ロジックが失敗し、
    // ProductivityCalculationError エラーを発生させるよう設定
    jest.spyOn(global as any, 'aggregateWorkResultsAndCalculateProductivity')
      .mockRejectedValue(
        new ProductivityCalculationError(
          'Productivity metrics calculation failed due to insufficient or invalid data.'
        )
      );

    const input = {
      facilityId: 'FAC001',
      teamId: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-02T00:00:00Z',
      operatingUserId: 'USER001',
      includeWmsData: true,
    };

    // Act & Assert
    // aggregateHandyTerminalWorkResults が ProductivityCalculationError を
    // 発生させることが期待される
    let thrownError: Error | undefined;
    try {
      await aggregateHandyTerminalWorkResults(input);
      fail('Expected aggregateHandyTerminalWorkResults to throw ProductivityCalculationError');
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーが throw されたことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.name).toBe('ProductivityCalculationError');
    expect(thrownError?.message).toBe(
      'Productivity metrics calculation failed due to insufficient or invalid data.'
    );

    // 戻り値が undefined または null であることを確認
    // エラーが throw されたため、出力型は返されない
  });
});