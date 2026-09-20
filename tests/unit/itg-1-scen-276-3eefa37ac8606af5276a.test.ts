import { extractAndRankAllocationPlansForReview } from '../../src/logic/allocation-plan-review-approval';
import * as authModule from '../../src/logic/auth-authorization-audit';
import * as validationModule from '../../src/logic/validation-common-calculation';
import * as persistenceModule from '../../src/logic/data-persistence';

describe('SCEN-276: 遅延リスク判定データの取得に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ取得失敗を示すエラーが返される', async () => {
    const userId = 'user123';
    const targetFacilityIds = ['FAC001', 'FAC002'];
    const timeRangeStart = '2024-01-15T09:00:00Z';
    const timeRangeEnd = '2024-01-15T17:00:00Z';
    const priorityFilter = 'high' as const;
    const maxResultCount = 50;

    // authorizeOperation スタブ：ユーザーが物流センター長権限を持つ状態
    jest.spyOn(authModule, 'authorizeOperation').mockResolvedValue(undefined);

    // validateDateTimeRange スタブ：時間帯が有効な状態
    jest.spyOn(validationModule, 'validateDateTimeRange').mockResolvedValue(undefined);

    // listAllocationPlansByCondition スタブ：複数の人員配置案を返す
    jest.spyOn(persistenceModule, 'listAllocationPlansByCondition').mockResolvedValue({
      allocationPlans: [
        {
          allocationPlanId: 'PLAN001',
          planName: 'Plan A',
          facilityId: 'FAC001',
          teamId: 'TEAM001',
          workInstructionId: 'WI001',
          allocatedWorkerCount: 5,
          plannedStartDate: '2024-01-15T09:00:00Z',
          plannedEndDate: '2024-01-15T17:00:00Z',
          priority: 'high',
          status: 'pending_review',
        },
      ],
      totalCount: 1,
      filteredAt: '2024-01-15T08:30:00Z',
    });

    // getRecentDelayRiskJudgmentByFacilityAndTeam スタブ：エラーを返す
    jest
      .spyOn(persistenceModule, 'getRecentDelayRiskJudgmentByFacilityAndTeam')
      .mockRejectedValue(new Error('Connection timeout'));

    // getLatestProductivityDataByWorker スタブ：正常終了（呼ばれない予定）
    jest
      .spyOn(persistenceModule, 'getLatestProductivityDataByWorker')
      .mockResolvedValue({});

    // 関数を実行して例外をキャッチ
    await expect(
      extractAndRankAllocationPlansForReview({
        userId,
        targetFacilityIds,
        timeRangeStart,
        timeRangeEnd,
        priorityFilter,
        maxResultCount,
      })
    ).rejects.toThrow(expect.objectContaining({
      message: expect.stringContaining('データ取得に失敗しました'),
    }));

    // authorizeOperation が呼ばれたことを確認
    expect(authModule.authorizeOperation).toHaveBeenCalled();

    // validateDateTimeRange が呼ばれたことを確認
    expect(validationModule.validateDateTimeRange).toHaveBeenCalled();

    // listAllocationPlansByCondition が呼ばれたことを確認
    expect(persistenceModule.listAllocationPlansByCondition).toHaveBeenCalled();

    // getRecentDelayRiskJudgmentByFacilityAndTeam が呼ばれたことを確認
    expect(persistenceModule.getRecentDelayRiskJudgmentByFacilityAndTeam).toHaveBeenCalled();
  });
});