import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

// テスト用のDB操作関数（仮）
// 実装環境では実際のDB接続・操作に置き換える
async function insertDelayRiskJudgments(records: any[]): Promise<void> {
  // 実装例：テスト用DBやスタブに対する挿入処理
  // ここでは仮の実装
  for (const record of records) {
    // DB挿入ロジック
  }
}

async function deleteAllDelayRiskJudgments(): Promise<void> {
  // テスト後のクリーンアップ
}

describe('作業進捗・人員配置最適化エンジン - SCEN-999', () => {
  describe('作成日時の範囲で検索結果を絞り込む', () => {
    beforeEach(async () => {
      // テスト環境の初期化
      await deleteAllDelayRiskJudgments();
    });

    afterEach(async () => {
      // テスト後のクリーンアップ
      await deleteAllDelayRiskJudgments();
    });

    it('should filter delay risk judgment results by creation date range', async () => {
      // テスト前提条件を準備する
      const rangeStartDate = '2024-01-15T00:00:00.000Z';
      const rangeEndDate = '2024-01-20T23:59:59.999Z';
      const outsideEarlyDate = '2024-01-10T00:00:00.000Z';
      const outsideLateDate = '2024-01-25T00:00:00.000Z';

      // テスト対象のデータベースに以下のデータを挿入する
      // (1) リスク判定結果を3件作成し、範囲内に異なる作成日時を設定
      const inRangeRecords = [
        {
          riskJudgmentId: 'risk-001',
          workInstructionId: 'wi-001',
          facilityId: 'fac-001',
          teamId: 'team-001',
          judgmentDateTime: '2024-01-17T10:00:00.000Z',
          riskLevel: 'HIGH',
          delayPredictionDays: 2,
          progressRate: 50,
          plannedProgressRate: 70,
          judgmentReason: 'Test reason 1',
          recommendedAction: 'Test action 1',
          actionStatus: 'pending',
          createdAt: '2024-01-15T08:30:00.000Z',
          createdBy: 'user-001',
          updatedAt: '2024-01-15T08:30:00.000Z',
        },
        {
          riskJudgmentId: 'risk-002',
          workInstructionId: 'wi-002',
          facilityId: 'fac-002',
          teamId: 'team-002',
          judgmentDateTime: '2024-01-18T14:00:00.000Z',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 1,
          progressRate: 60,
          plannedProgressRate: 70,
          judgmentReason: 'Test reason 2',
          recommendedAction: 'Test action 2',
          actionStatus: 'in_progress',
          createdAt: '2024-01-17T12:00:00.000Z',
          createdBy: 'user-002',
          updatedAt: '2024-01-17T12:00:00.000Z',
        },
        {
          riskJudgmentId: 'risk-003',
          workInstructionId: 'wi-003',
          facilityId: 'fac-003',
          teamId: 'team-003',
          judgmentDateTime: '2024-01-19T09:00:00.000Z',
          riskLevel: 'LOW',
          delayPredictionDays: 0,
          progressRate: 80,
          plannedProgressRate: 75,
          judgmentReason: 'Test reason 3',
          recommendedAction: 'Test action 3',
          actionStatus: 'completed',
          createdAt: '2024-01-20T15:30:00.000Z',
          createdBy: 'user-003',
          updatedAt: '2024-01-20T15:30:00.000Z',
        },
      ];

      // (2) リスク判定結果を2件作成し、作成日時がこの範囲外に設定
      const outOfRangeRecords = [
        {
          riskJudgmentId: 'risk-004',
          workInstructionId: 'wi-004',
          facilityId: 'fac-004',
          teamId: 'team-004',
          judgmentDateTime: '2024-01-08T10:00:00.000Z',
          riskLevel: 'HIGH',
          delayPredictionDays: 3,
          progressRate: 40,
          plannedProgressRate: 70,
          judgmentReason: 'Test reason 4',
          recommendedAction: 'Test action 4',
          actionStatus: 'pending',
          createdAt: outsideEarlyDate,
          createdBy: 'user-004',
          updatedAt: outsideEarlyDate,
        },
        {
          riskJudgmentId: 'risk-005',
          workInstructionId: 'wi-005',
          facilityId: 'fac-005',
          teamId: 'team-005',
          judgmentDateTime: '2024-01-28T10:00:00.000Z',
          riskLevel: 'MEDIUM',
          delayPredictionDays: 2,
          progressRate: 55,
          plannedProgressRate: 70,
          judgmentReason: 'Test reason 5',
          recommendedAction: 'Test action 5',
          actionStatus: 'pending',
          createdAt: outsideLateDate,
          createdBy: 'user-005',
          updatedAt: outsideLateDate,
        },
      ];

      const allRecords = [...inRangeRecords, ...outOfRangeRecords];
      
      // テスト対象のデータベースにデータを挿入する
      await insertDelayRiskJudgments(allRecords);

      // listDelayRiskJudgmentByCondition 処理を呼び出す
      const result = await listDelayRiskJudgmentByCondition({
        createdFromDate: rangeStartDate,
        createdToDate: rangeEndDate,
        // 以下のパラメータはすべて null または undefined
        riskJudgmentIds: undefined,
        workInstructionIds: undefined,
        facilityIds: undefined,
        teamIds: undefined,
        riskLevels: undefined,
        actionStatuses: undefined,
        minDelayPredictionDays: undefined,
        maxDelayPredictionDays: undefined,
        minProgressRate: undefined,
        maxProgressRate: undefined,
        judgmentDateFromDateTime: undefined,
        judgmentDateToDateTime: undefined,
        updatedFromDate: undefined,
        updatedToDate: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      });

      // 処理の戻り値を検証する
      // (1) delayRiskJudgments フィールドが GetDelayRiskJudgmentByIdOutput 型の配列として返される
      expect(result).toBeDefined();
      expect(result.delayRiskJudgments).toBeDefined();
      expect(Array.isArray(result.delayRiskJudgments)).toBe(true);

      // その配列に格納されるのは作成日時が '2024-01-15' 以上 '2024-01-20' 以下のリスク判定結果データ3件のみであること
      expect(result.delayRiskJudgments.length).toBe(3);

      // 全てのレコードが範囲内にあることを確認
      const rangeStart = new Date(rangeStartDate);
      const rangeEnd = new Date(rangeEndDate);
      result.delayRiskJudgments.forEach((judgment) => {
        const createdAtDate = new Date(judgment.createdAt);
        expect(createdAtDate.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
        expect(createdAtDate.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
      });

      // (2) 作成日時範囲外のリスク判定結果データが含まれていないこと
      // 返されたレコードのIDが範囲外レコードのIDと一致しないことで検証
      const returnedRiskJudgmentIds = result.delayRiskJudgments.map(j => j.riskJudgmentId);
      expect(returnedRiskJudgmentIds).not.toContain('risk-004');
      expect(returnedRiskJudgmentIds).not.toContain('risk-005');

      // (3) totalCount フィールドが 3 として返されること（範囲内のレコード総数）
      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe('number');
      expect(result.totalCount).toBe(3);

      // (4) pageNumber フィールドが null または返却されないこと（ページングが指定されていないため）
      expect([null, undefined]).toContain(result.pageNumber);

      // (5) pageSize フィールドが null または返却されないこと（ページングが指定されていないため）
      expect([null, undefined]).toContain(result.pageSize);

      // (6) retrievedAt フィールドが ISO 8601 形式の現在時刻に近い値として返されること
      expect(result.retrievedAt).toBeDefined();
      const retrievedAtDate = new Date(result.retrievedAt);
      // ISO 8601形式であることを確認（基本的なフォーマットチェック）
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);
      // 現在時刻に近い値であること（1分以内）を確認
      const timeDifference = Math.abs(retrievedAtDate.getTime() - Date.now());
      expect(timeDifference).toBeLessThan(60000); // 1分以内

      // (7) エラーが発生しないことは、このテストが完走することで確認
    });
  });
});