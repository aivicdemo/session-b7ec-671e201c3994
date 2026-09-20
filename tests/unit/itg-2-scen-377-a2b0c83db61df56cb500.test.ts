import { buildOptimalPlacementProposalScreen } from '../../src/logic/optimal-placement-proposal-presentation';

// 依存モジュールのモック
jest.mock('../../src/db/repositories', () => ({
  authorizeUserAction: jest.fn(),
  findPlacementPlanByWorkerAndDate: jest.fn(),
  findProductivityDataByWorkerAndPeriod: jest.fn(),
  fetchPlacementProposalSummary: jest.fn(),
  fetchCurrentPlacementStatus: jest.fn(),
  fetchProposedPlacementList: jest.fn(),
  fetchPlacementDetailView: jest.fn(),
  calculateProductivityImprovementForecast: jest.fn(),
  determineScreenState: jest.fn(),
}));

import * as repositories from '../../src/db/repositories';

describe('SCEN-377: buildOptimalPlacementProposalScreen エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('配置案に紐づく作業者の生産性データが集計対象期間内に0件の場合、InsufficientProductivityDataエラーを発生させる', async () => {
    // 準備：入力データを定義
    const placementProposalId = 'proposal-001';
    const userId = 'user-001';
    const analysisPeriodStartDate = '2024-01-01';
    const analysisPeriodEndDate = '2024-01-31';

    // スタブ設定：authorizeUserAction は権限あり
    (repositories.authorizeUserAction as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    // スタブ設定：findPlacementPlanByWorkerAndDate は作業者リストを返す
    (repositories.findPlacementPlanByWorkerAndDate as jest.Mock).mockResolvedValue([
      { worker_id: 'worker-A' },
      { worker_id: 'worker-B' },
      { worker_id: 'worker-C' },
    ]);

    // スタブ設定：findProductivityDataByWorkerAndPeriod は各作業者に対して0件のデータを返す
    (repositories.findProductivityDataByWorkerAndPeriod as jest.Mock).mockImplementation(
      (workerId, startDate, endDate) => {
        // 各作業者について空配列を返す
        return Promise.resolve([]);
      }
    );

    // 実行：関数を呼び出し
    try {
      await buildOptimalPlacementProposalScreen(
        placementProposalId,
        userId,
        analysisPeriodStartDate,
        analysisPeriodEndDate
      );
      fail('エラーが発生することが期待されます');
    } catch (error: unknown) {
      // 検証：エラーが Error インスタンスであることを確認
      expect(error).toBeInstanceOf(Error);
      const err = error as Error;

      // 検証：エラータイプが InsufficientProductivityData であることを確認
      expect(err.name).toBe('InsufficientProductivityData');

      // 検証：エラーメッセージが期待値であることを確認
      expect(err.message).toBe('生産性データが不足しているため、予測値を計算できません。');

      // 検証：authorizeUserAction が呼び出されたことを確認
      expect(repositories.authorizeUserAction).toHaveBeenCalledWith(
        userId,
        placementProposalId
      );

      // 検証：findPlacementPlanByWorkerAndDate が呼び出されたことを確認
      expect(repositories.findPlacementPlanByWorkerAndDate).toHaveBeenCalledWith(
        placementProposalId
      );

      // 検証：findProductivityDataByWorkerAndPeriod が各作業者に対して呼び出されたことを確認
      expect(repositories.findProductivityDataByWorkerAndPeriod).toHaveBeenCalledWith(
        'worker-A',
        analysisPeriodStartDate,
        analysisPeriodEndDate
      );
      expect(repositories.findProductivityDataByWorkerAndPeriod).toHaveBeenCalledWith(
        'worker-B',
        analysisPeriodStartDate,
        analysisPeriodEndDate
      );
      expect(repositories.findProductivityDataByWorkerAndPeriod).toHaveBeenCalledWith(
        'worker-C',
        analysisPeriodStartDate,
        analysisPeriodEndDate
      );
    }
  });
});