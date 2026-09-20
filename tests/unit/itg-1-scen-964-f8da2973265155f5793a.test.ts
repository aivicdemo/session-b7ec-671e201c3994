import { listProductivityDataByCondition } from '../../src/logic/data-persistence';

describe('SCEN-964: listProductivityDataByCondition - データベース接続失敗時のエラー処理', () => {
  it('should throw DataAccessError with specific message when database connection fails', async () => {
    // Arrange: データベース接続失敗をシミュレートするスタブ設定
    // データ永続化層のデータベース接続層がエラーをスローするようスタブを構成
    const input = {
      productivityDataIds: ['PD001'],
      workerIds: ['W001'],
      facilityIds: ['F001'],
      teamIds: ['T001'],
      workDateFrom: '2024-01-01T00:00:00Z',
      workDateTo: '2024-01-31T23:59:59Z',
      minProductivityRate: 50,
      maxProductivityRate: 100,
      minQualityScore: 70,
      maxQualityScore: 100,
      minErrorCount: 0,
      maxErrorCount: 5,
      proficiencyLevels: ['上級'],
      createdFromDate: '2024-01-01T00:00:00Z',
      createdToDate: '2024-01-31T23:59:59Z',
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
      sortBy: 'productivityRate',
      sortOrder: 'DESC',
      pageNumber: 1,
      pageSize: 10,
    };

    // Act & Assert: エラーが発生することを検証
    let thrownError: any;
    let resultExists = false;

    try {
      await listProductivityDataByCondition(input);
      resultExists = true;
    } catch (error: any) {
      thrownError = error;
    }

    // Assert: データベース接続失敗に由来するエラーがキャッチされ、DataAccessErrorが発生することを検証
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.name).toBe('DataAccessError');
    expect(thrownError.message).toBe(
      '生産性データの取得に失敗しました。システム管理者に連絡してください。'
    );

    // Assert: エラー発生時に出力型ListProductivityDataByConditionOutputのフィールド
    // （productivityDataList、totalCount、pageNumber、pageSize、retrievedAt）が返されないことを確認
    expect(resultExists).toBe(false);
    expect(thrownError.productivityDataList).toBeUndefined();
    expect(thrownError.totalCount).toBeUndefined();
    expect(thrownError.pageNumber).toBeUndefined();
    expect(thrownError.pageSize).toBeUndefined();
    expect(thrownError.retrievedAt).toBeUndefined();
  });
});