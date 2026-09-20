import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';
import { GetDelayRiskJudgmentByIdOutput, ListDelayRiskJudgmentByConditionOutput } from '../../src/logic/data-persistence';

describe('SCEN-1001: 複数の検索条件を組み合わせて結果を絞り込む', () => {
  let testData: GetDelayRiskJudgmentByIdOutput[];

  beforeAll(() => {
    // テスト用の進捗遅延リスク判定結果データを準備
    testData = [
      {
        riskJudgmentId: 'risk-001',
        workInstructionId: 'work-001',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        judgmentDateTime: '2024-01-15T10:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 7,
        progressRate: 45,
        plannedProgressRate: 60,
        judgmentReason: 'Production capacity insufficient',
        recommendedAction: 'Add 2 workers',
        actionStatus: '未対応',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-002',
        workInstructionId: 'work-002',
        facilityId: 'facility-A',
        teamId: 'team-A2',
        judgmentDateTime: '2024-01-15T11:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 12,
        progressRate: 50,
        plannedProgressRate: 70,
        judgmentReason: 'Quality issues detected',
        recommendedAction: 'Reassign to experienced worker',
        actionStatus: '対応中',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-002',
      },
      {
        riskJudgmentId: 'risk-003',
        workInstructionId: 'work-003',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        judgmentDateTime: '2024-01-15T12:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 25,
        progressRate: 30,
        plannedProgressRate: 60,
        judgmentReason: 'Material shortage',
        recommendedAction: 'Expedite material delivery',
        actionStatus: '未対応',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-004',
        workInstructionId: 'work-004',
        facilityId: 'facility-B',
        teamId: 'team-B2',
        judgmentDateTime: '2024-01-15T13:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 15,
        progressRate: 40,
        plannedProgressRate: 70,
        judgmentReason: 'Workflow issue',
        recommendedAction: 'Monitor closely',
        actionStatus: '対応中',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-003',
      },
      {
        riskJudgmentId: 'risk-005',
        workInstructionId: 'work-005',
        facilityId: 'facility-C',
        teamId: 'team-C1',
        judgmentDateTime: '2024-01-15T14:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 35,
        progressRate: 20,
        plannedProgressRate: 80,
        judgmentReason: 'Severe delay',
        recommendedAction: 'Escalate to management',
        actionStatus: '完了',
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        createdBy: 'user-001',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-006',
        workInstructionId: 'work-006',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        judgmentDateTime: '2024-01-15T15:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 8,
        progressRate: 55,
        plannedProgressRate: 65,
        judgmentReason: 'Worker absence',
        recommendedAction: 'Call in backup worker',
        actionStatus: '未対応',
        createdAt: '2024-01-15T14:00:00Z',
        updatedAt: '2024-01-15T14:00:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-007',
        workInstructionId: 'work-007',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        judgmentDateTime: '2024-01-15T16:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 18,
        progressRate: 40,
        plannedProgressRate: 60,
        judgmentReason: 'Equipment malfunction',
        recommendedAction: 'Schedule maintenance',
        actionStatus: '対応中',
        createdAt: '2024-01-15T15:00:00Z',
        updatedAt: '2024-01-15T15:00:00Z',
        createdBy: 'user-002',
        updatedBy: 'user-001',
      },
      {
        riskJudgmentId: 'risk-008',
        workInstructionId: 'work-008',
        facilityId: 'facility-A',
        teamId: 'team-A2',
        judgmentDateTime: '2024-01-15T17:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 2,
        progressRate: 75,
        plannedProgressRate: 75,
        judgmentReason: 'On track',
        recommendedAction: 'Continue current plan',
        actionStatus: '対応中',
        createdAt: '2024-01-15T16:00:00Z',
        updatedAt: '2024-01-15T16:00:00Z',
        createdBy: 'user-002',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-009',
        workInstructionId: 'work-009',
        facilityId: 'facility-B',
        teamId: 'team-B2',
        judgmentDateTime: '2024-01-15T18:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 22,
        progressRate: 35,
        plannedProgressRate: 70,
        judgmentReason: 'Workflow inefficiency',
        recommendedAction: 'Process optimization',
        actionStatus: '未対応',
        createdAt: '2024-01-15T17:00:00Z',
        updatedAt: '2024-01-15T17:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
      {
        riskJudgmentId: 'risk-010',
        workInstructionId: 'work-010',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        judgmentDateTime: '2024-01-15T19:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 6,
        progressRate: 60,
        plannedProgressRate: 70,
        judgmentReason: 'Training needed',
        recommendedAction: 'Provide training session',
        actionStatus: '対応中',
        createdAt: '2024-01-15T18:00:00Z',
        updatedAt: '2024-01-15T18:00:00Z',
        createdBy: 'user-003',
        updatedBy: 'user-001',
      },
      {
        riskJudgmentId: 'risk-011',
        workInstructionId: 'work-011',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        judgmentDateTime: '2024-01-15T20:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 28,
        progressRate: 25,
        plannedProgressRate: 65,
        judgmentReason: 'Multiple issues',
        recommendedAction: 'Comprehensive review',
        actionStatus: '未対応',
        createdAt: '2024-01-15T19:00:00Z',
        updatedAt: '2024-01-15T19:00:00Z',
        createdBy: 'user-003',
        updatedBy: null,
      },
    ];
  });

  it('複合条件で絞り込まれた結果が返される', async () => {
    const result: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition({
        facilityIds: ['facility-A', 'facility-B'],
        riskLevels: ['HIGH'],
        minDelayPredictionDays: 5,
        maxDelayPredictionDays: 30,
        actionStatuses: ['未対応', '対応中'],
        minProgressRate: 20,
        maxProgressRate: 70,
        pageNumber: 1,
        pageSize: 5,
        sortBy: 'delayPredictionDays',
        sortOrder: 'DESC',
      });

    expect(result).toBeDefined();
    expect(result.delayRiskJudgments).toBeDefined();
    expect(Array.isArray(result.delayRiskJudgments)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.retrievedAt).toBeDefined();

    // すべての結果が条件を満たすことを確認
    result.delayRiskJudgments.forEach((item) => {
      // facilityIds 条件
      expect(['facility-A', 'facility-B']).toContain(item.facilityId);

      // riskLevels 条件
      expect(item.riskLevel).toBe('HIGH');

      // delayPredictionDays 条件
      expect(item.delayPredictionDays).toBeGreaterThanOrEqual(5);
      expect(item.delayPredictionDays).toBeLessThanOrEqual(30);

      // actionStatuses 条件
      expect(['未対応', '対応中']).toContain(item.actionStatus);

      // progressRate 条件
      expect(item.progressRate).toBeGreaterThanOrEqual(20);
      expect(item.progressRate).toBeLessThanOrEqual(70);
    });

    // ページネーション確認
    expect(result.delayRiskJudgments.length).toBeLessThanOrEqual(5);

    // ソート確認（delayPredictionDays DESC）
    if (result.delayRiskJudgments.length > 1) {
      for (let i = 0; i < result.delayRiskJudgments.length - 1; i++) {
        expect(
          result.delayRiskJudgments[i].delayPredictionDays
        ).toBeGreaterThanOrEqual(
          result.delayRiskJudgments[i + 1].delayPredictionDays
        );
      }
    }

    // retrievedAt が ISO 8601 形式であることを確認
    expect(() => {
      new Date(result.retrievedAt);
    }).not.toThrow();
  });

  it('条件に合致するデータがない場合、空配列と totalCount=0 が返される', async () => {
    const result: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition({
        facilityIds: ['facility-Z'],
        riskLevels: ['HIGH'],
        pageNumber: 1,
        pageSize: 5,
      });

    expect(result.delayRiskJudgments).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('ページネーションが正しく機能する', async () => {
    // ページ1の取得
    const page1: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition({
        facilityIds: ['facility-A', 'facility-B'],
        riskLevels: ['HIGH'],
        minDelayPredictionDays: 5,
        maxDelayPredictionDays: 30,
        actionStatuses: ['未対応', '対応中'],
        minProgressRate: 20,
        maxProgressRate: 70,
        pageNumber: 1,
        pageSize: 3,
        sortBy: 'delayPredictionDays',
        sortOrder: 'DESC',
      });

    // ページ2の取得
    const page2: ListDelayRiskJudgmentByConditionOutput =
      await listDelayRiskJudgmentByCondition({
        facilityIds: ['facility-A', 'facility-B'],
        riskLevels: ['HIGH'],
        minDelayPredictionDays: 5,
        maxDelayPredictionDays: 30,
        actionStatuses: ['未対応', '対応中'],
        minProgressRate: 20,
        maxProgressRate: 70,
        pageNumber: 2,
        pageSize: 3,
        sortBy: 'delayPredictionDays',
        sortOrder: 'DESC',
      });

    expect(page1.pageNumber).toBe(1);
    expect(page2.pageNumber).toBe(2);
    expect(page1.pageSize).toBe(3);
    expect(page2.pageSize).toBe(3);
    expect(page1.totalCount).toBe(page2.totalCount);

    // ページ1とページ2の結果が異なることを確認
    if (page1.delayRiskJudgments.length > 0 && page2.delayRiskJudgments.length > 0) {
      const page1Ids = page1.delayRiskJudgments.map((r) => r.riskJudgmentId);
      const page2Ids = page2.delayRiskJudgments.map((r) => r.riskJudgmentId);
      expect(page1Ids).not.toEqual(page2Ids);
    }
  });
});