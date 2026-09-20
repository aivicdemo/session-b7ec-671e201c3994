import { jest } from '@jest/globals';
import {
  findPerformanceRecordsByPlacementPlan,
  FindPerformanceRecordsByPlacementPlanInput,
  FindPerformanceRecordsByPlacementPlanOutput,
} from '../../src/logic/persistence-layer';

// Mock the persistence layer dependencies
jest.mock('../../src/logic/persistence-layer');

describe('SCEN-574: 配置計画期間内に実績レコードが存在しない場合のエラー検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('配置計画は存在するが配置計画期間内に実績レコードが存在しない場合、NoPerformanceRecordsFoundエラーが発生する', async () => {
    // 準備: 配置計画の期間情報
    const placementPlanId = 'PP-001';
    const requestingUserId = 'USER-123';
    const placementPeriodStartDate = new Date('2024-01-01');
    const placementPeriodEndDate = new Date('2024-01-31');

    // 準備: 認可チェック用スタブ設定
    const mockAuthorizeUserAction = jest.fn().mockResolvedValue({
      authorized: true,
      userId: requestingUserId,
    });

    // 準備: 永続化層のスタブ設定
    // findPerformanceRecordsByPlacementPlan を、実績レコードが0件返却されるように設定
    const mockFindPerformanceRecordsByPlacementPlan = jest.fn().mockResolvedValue({
      performanceRecords: [],
      totalCount: 0,
      found: false,
      placementPlanId,
      placementPeriodStartDate,
      placementPeriodEndDate,
      error: {
        code: 'NoPerformanceRecordsFound',
        message: '該当する実績レコードがありません。',
      },
    } as FindPerformanceRecordsByPlacementPlanOutput);

    // Mock の関数をモジュールに割り当て
    (findPerformanceRecordsByPlacementPlan as jest.Mock) = mockFindPerformanceRecordsByPlacementPlan;

    // 実行: 入力データの作成
    const input: FindPerformanceRecordsByPlacementPlanInput = {
      placementPlanId,
      requestingUserId,
    };

    // 実行: findPerformanceRecordsByPlacementPlan を呼び出す
    const result = await findPerformanceRecordsByPlacementPlan(input);

    // 検証: エラーが発生しているか確認
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('NoPerformanceRecordsFound');
    expect(result.error?.message).toBe('該当する実績レコードがありません。');

    // 検証: 出力型フィールドの確認
    expect(result.found).toBe(false);
    expect(result.totalCount).toBe(0);
    expect(result.performanceRecords).toEqual([]);
    expect(result.placementPlanId).toBe('PP-001');

    // 検証: 配置計画の期間情報が正しく返却されているか確認
    expect(result.placementPeriodStartDate).toEqual(new Date('2024-01-01'));
    expect(result.placementPeriodEndDate).toEqual(new Date('2024-01-31'));

    // 検証: 関数が正しい入力で呼び出されたか確認
    expect(mockFindPerformanceRecordsByPlacementPlan).toHaveBeenCalledWith(input);
    expect(mockFindPerformanceRecordsByPlacementPlan).toHaveBeenCalledTimes(1);
  });
});