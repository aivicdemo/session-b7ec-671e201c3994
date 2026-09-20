import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1018: ページ番号が総ページ数を超える場合は空の配列を返す', () => {
  it('ページ番号が総ページ数を超える場合、空の配列とメタデータを返す', async () => {
    // Arrange: テスト用の進捗遅延リスク判定結果データを事前にデータベースに登録
    // 50件のデータをページサイズ10件で5ページ分用意
    const testData = Array.from({ length: 50 }, (_, i) => ({
      riskJudgmentId: `judgment-${i + 1}`,
      workInstructionId: `work-${i + 1}`,
      facilityId: `facility-1`,
      teamId: `team-1`,
      judgmentDateTime: new Date(Date.now() - (i * 60000)).toISOString(),
      riskLevel: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
      delayPredictionDays: Math.floor(Math.random() * 5) + 1,
      progressRate: Math.floor(Math.random() * 100),
      plannedProgressRate: 50 + i,
      judgmentReason: `リスク判定理由-${i + 1}`,
      recommendedAction: `推奨対応-${i + 1}`,
      actionStatus: 'pending',
      createdAt: new Date(Date.now() - (i * 60000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 60000)).toISOString(),
      createdBy: 'user-1',
      updatedBy: null,
    }));

    // データベースにデータを登録する（モック不要であれば実際のDB操作）
    // ここでは想定される入力値として使用

    // Act: listDelayRiskJudgmentByCondition を呼び出す
    // ページ番号が6（総ページ数5を超える値）、ページサイズが10
    const result = await listDelayRiskJudgmentByCondition({
      riskJudgmentIds: null,
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 6,
      pageSize: 10,
    });

    // Assert: 戻り値を確認
    expect(result.delayRiskJudgments).toEqual([]);
    expect(result.totalCount).toBe(50);
    expect(result.pageNumber).toBe(6);
    expect(result.pageSize).toBe(10);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});