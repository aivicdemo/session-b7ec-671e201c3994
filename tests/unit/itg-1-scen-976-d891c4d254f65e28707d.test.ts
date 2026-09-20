import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-976', () => {
  describe('遅延予測日数が負の値であるとき、InvalidDelayPredictionDaysエラーを発生させる', () => {
    it('delayPredictionDaysが-1の場合、InvalidDelayPredictionDaysエラーを返す', async () => {
      const input = {
        riskJudgmentId: null,
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        judgmentDateTime: '2024-01-15T10:30:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: -1,
        progressRate: 50,
        plannedProgressRate: 70,
        judgmentReason: '人員不足',
        recommendedAction: '人員追加',
        createdBy: 'USER-001',
      };

      await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidDelayPredictionDays',
          message: '遅延予測日数は0以上である必要があります。',
        })
      );
    });

    it('delayPredictionDaysが-100の場合、InvalidDelayPredictionDaysエラーを返す', async () => {
      const input = {
        riskJudgmentId: null,
        workInstructionId: 'WI-002',
        facilityId: 'FAC-002',
        teamId: 'TEAM-002',
        judgmentDateTime: '2024-01-15T11:00:00Z',
        riskLevel: 'MEDIUM',
        delayPredictionDays: -100,
        progressRate: 75,
        plannedProgressRate: 80,
        judgmentReason: 'テスト',
        recommendedAction: 'テスト対応',
        createdBy: 'USER-002',
      };

      await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidDelayPredictionDays',
          message: '遅延予測日数は0以上である必要があります。',
        })
      );
    });

    it('delayPredictionDaysが0の場合、エラーを返さない', async () => {
      const input = {
        riskJudgmentId: null,
        workInstructionId: 'WI-003',
        facilityId: 'FAC-003',
        teamId: 'TEAM-003',
        judgmentDateTime: '2024-01-15T12:00:00Z',
        riskLevel: 'LOW',
        delayPredictionDays: 0,
        progressRate: 90,
        plannedProgressRate: 90,
        judgmentReason: 'テスト',
        recommendedAction: 'テスト対応',
        createdBy: 'USER-003',
      };

      await expect(saveDelayRiskJudgment(input)).resolves.toBeDefined();
    });

    it('delayPredictionDaysが正の値の場合、エラーを返さない', async () => {
      const input = {
        riskJudgmentId: null,
        workInstructionId: 'WI-004',
        facilityId: 'FAC-004',
        teamId: 'TEAM-004',
        judgmentDateTime: '2024-01-15T13:00:00Z',
        riskLevel: 'HIGH',
        delayPredictionDays: 5,
        progressRate: 40,
        plannedProgressRate: 70,
        judgmentReason: 'テスト',
        recommendedAction: 'テスト対応',
        createdBy: 'USER-004',
      };

      await expect(saveDelayRiskJudgment(input)).resolves.toBeDefined();
    });
  });
});