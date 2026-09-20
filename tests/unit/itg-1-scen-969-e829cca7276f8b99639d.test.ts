import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';

describe('SCEN-969: 進捗遅延リスク判定結果の新規作成と永続化', () => {
  it('新規作成時に、入力された判定内容・推奨対応・作成者情報を保存し、新規判定IDを付与して返却する', async () => {
    const input = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      judgmentDateTime: '2024-01-15T10:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 3,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足により進捗が計画比-15%',
      recommendedAction: 'チームAに作業者2名を追加配置',
      createdBy: 'USER-001',
    };

    const result = await saveDelayRiskJudgment(input);

    expect(result.riskJudgmentId).toBeDefined();
    expect(result.riskJudgmentId).not.toBeNull();
    expect(result.riskJudgmentId).toMatch(/^DRJD-\d{8}-\d{3}$/);
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-A');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.delayPredictionDays).toBe(3);
    expect(result.recommendedAction).toBe('チームAに作業者2名を追加配置');
    expect(result.savedAt).toBeDefined();
    expect(result.isNewRecord).toBe(true);

    const savedAtDate = new Date(result.savedAt);
    const now = new Date();
    expect(savedAtDate.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime() - savedAtDate.getTime()).toBeLessThan(5000);
  });
});