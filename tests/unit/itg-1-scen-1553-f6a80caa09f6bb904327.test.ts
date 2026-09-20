import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('作業進捗・人員配置最適化エンジン - SCEN-1553', () => {
  describe('進捗遅延リスク常時監視', () => {
    it('納期までの残り時間が0以下のとき、エラーメッセージ「納期が既に過ぎています。緊急対応が必要です」がスローされる', async () => {
      // Arrange
      const facilityIds = ['facility-001'];
      const teamIds = ['team-001'];
      const workInstructionIds = ['work-instruction-001'];
      const evaluationDateTime = '2024-01-15T10:00:00Z';
      const userId = 'user-001';

      const input = {
        facilityIds,
        teamIds,
        workInstructionIds,
        evaluationDateTime,
        userId,
        currentProgress: 50,
        plannedProgressAtNow: 80,
        averageWorkerProductivity: 100,
        remainingWorkQuantity: 500,
        currentWorkerCount: 5,
        riskThresholdPercent: 70,
        remainingTimeMinutes: -30,
      };

      // Act & Assert
      await expect(
        monitorAndJudgeDelayRisk(input)
      ).rejects.toThrow('納期が既に過ぎています。緊急対応が必要です');
    });
  });
});