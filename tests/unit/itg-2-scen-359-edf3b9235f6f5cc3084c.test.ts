import { analyzeBusyPeriodProductivityAndProposePlacement } from '../../src/logic/busy-period-productivity-analysis';

describe('SCEN-359: 繁忙期の受注急増検知時の複数チーム進捗・生産性分析と統合提案', () => {
  describe('新人や習熟中の作業者について、現在の習熟度に合わせた作業難度の段階的調整を提案できる', () => {
    it('新人作業者と習熟中の作業者の難度調整推奨を生成する', async () => {
      const targetTeamIds = ['team-001', 'team-002'];
      const analysisStartDate = '2025-01-01T00:00:00Z';
      const analysisEndDate = '2025-01-07T23:59:59Z';
      const requestedByUserId = 'user-manager-001';

      const currentProgressDataSnapshot = {
        teams: [
          {
            teamId: 'team-001',
            teamName: 'ピッキングチーム',
            progressRate: 65,
            completedCount: 1300,
            totalCount: 2000,
            delayRiskLevel: 'high',
            activeWorkerCount: 8,
            workers: [
              {
                workerId: 'worker-beginner-001',
                workerName: '新人A',
                skillLevel: 'beginner',
                currentTaskType: 'complex-sorting',
                avgProcessingTimeMinutes: 45,
                completionCountPerDay: 12,
                errorRate: 0.18,
                proficiencyLevel: 'novice',
              },
              {
                workerId: 'worker-intermediate-001',
                workerName: '習熟中B',
                skillLevel: 'intermediate',
                currentTaskType: 'precision-packing',
                avgProcessingTimeMinutes: 28,
                completionCountPerDay: 21,
                errorRate: 0.08,
                proficiencyLevel: 'developing',
              },
            ],
          },
          {
            teamId: 'team-002',
            teamName: '検査チーム',
            progressRate: 58,
            completedCount: 1160,
            totalCount: 2000,
            delayRiskLevel: 'high',
            activeWorkerCount: 7,
            workers: [
              {
                workerId: 'worker-beginner-002',
                workerName: '新人C',
                skillLevel: 'beginner',
                currentTaskType: 'quality-check',
                avgProcessingTimeMinutes: 38,
                completionCountPerDay: 14,
                errorRate: 0.15,
                proficiencyLevel: 'novice',
              },
            ],
          },
        ],
      };

      const result = await analyzeBusyPeriodProductivityAndProposePlacement({
        targetTeamIds,
        analysisStartDate,
        analysisEndDate,
        currentProgressDataSnapshot,
        requestedByUserId,
      });

      expect(result).toBeDefined();
      expect(result.analysisExecutedAt).toBeDefined();
      expect(new Date(result.analysisExecutedAt)).toBeInstanceOf(Date);

      expect(result.workDifficultyAdjustmentRecommendations).toBeInstanceOf(Array);
      expect(result.workDifficultyAdjustmentRecommendations.length).toBeGreaterThan(0);

      const beginnerWorkerAdjustments = result.workDifficultyAdjustmentRecommendations.filter(
        (rec: any) => rec.workerId.includes('beginner')
      );
      expect(beginnerWorkerAdjustments.length).toBeGreaterThan(0);

      beginnerWorkerAdjustments.forEach((adjustment: any) => {
        expect(adjustment).toHaveProperty('workerId');
        expect(adjustment).toHaveProperty('currentDifficultyLevel');
        expect(adjustment).toHaveProperty('recommendedDifficultyLevel');
        expect(adjustment).toHaveProperty('adjustmentDirection');
        expect(adjustment).toHaveProperty('recommendedWorkTypeId');
        expect(adjustment).toHaveProperty('justificationReason');
        expect(adjustment).toHaveProperty('expectedProductivityImprovement');
        expect(adjustment).toHaveProperty('implementationTiming');
        expect(adjustment).toHaveProperty('riskAssessment');
        expect(adjustment).toHaveProperty('generatedAt');

        expect(['up', 'down', 'maintain']).toContain(adjustment.adjustmentDirection);
        expect(['basic', 'beginner']).toContain(adjustment.recommendedDifficultyLevel);
        expect(adjustment.justificationReason).toBeTruthy();
        expect(typeof adjustment.justificationReason).toBe('string');
        const reasonLower = adjustment.justificationReason.toLowerCase();
        expect(reasonLower).toMatch(/新人|段階的|基本/);
        expect(adjustment.expectedProductivityImprovement).toBeGreaterThanOrEqual(0);
        expect(['low', 'medium', 'high']).toContain(adjustment.riskAssessment);
      });

      const intermediateWorkerAdjustments = result.workDifficultyAdjustmentRecommendations.filter(
        (rec: any) => rec.workerId === 'worker-intermediate-001'
      );
      expect(intermediateWorkerAdjustments.length).toBeGreaterThan(0);

      intermediateWorkerAdjustments.forEach((adjustment: any) => {
        expect(['intermediate', 'advanced']).toContain(adjustment.recommendedDifficultyLevel);
        const reasonLower = adjustment.justificationReason.toLowerCase();
        expect(reasonLower).toMatch(/習熟度/);
        expect(reasonLower).toMatch(/維持|集中|向上/);
      });

      expect(result.notificationSent).toBe(true);
      expect(typeof result.notificationSent).toBe('boolean');
    });
  });
});