import { analyzeBusyPeriodProductivityAndProposePlacement } from '../../src/logic/busy-period-productivity-analysis';

describe('analyzeBusyPeriodProductivityAndProposePlacement', () => {
  describe('予定納期が現在時刻より前の場合', () => {
    it('警告が発生する', async () => {
      const now = new Date('2024-12-20T14:00:00Z');
      const pastDeadline = new Date('2024-12-20T10:00:00Z');
      
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const input = {
        targetTeamIds: ['TEAM001', 'TEAM002'],
        analysisStartDate: '2024-12-01',
        analysisEndDate: '2024-12-20',
        currentProgressDataSnapshot: {
          tasks: [
            {
              taskId: 'TASK001',
              teamId: 'TEAM001',
              plannedDeadline: pastDeadline.toISOString(),
              currentProgress: 50,
              status: 'in_progress',
            },
          ],
        },
        requestedByUserId: 'USER001',
      };

      const warnSpy = jest.spyOn(console, 'warn');

      try {
        const result = await analyzeBusyPeriodProductivityAndProposePlacement(input);

        expect(warnSpy).toHaveBeenCalled();
        const warnCalls = warnSpy.mock.calls.map(call => call[0]);
        const warningMessage = warnCalls.find(
          msg => typeof msg === 'string' && msg === '予定納期が過去になっています。タスク情報を確認してください'
        );
        expect(warningMessage).toBeDefined();

        expect(result).toBeDefined();
        expect(result.analysisExecutedAt).toBeDefined();
        expect(typeof result.analysisExecutedAt).toBe('string');
        
        expect(result.multiTeamProgressSummary).toBeDefined();
        expect(typeof result.multiTeamProgressSummary).toBe('object');
        
        expect(result.productivityPatternsByWorker).toBeDefined();
        expect(Array.isArray(result.productivityPatternsByWorker)).toBe(true);
        
        expect(result.delayRiskAssessment).toBeDefined();
        expect(typeof result.delayRiskAssessment).toBe('object');
        
        expect(result.optimalPlacementProposal).toBeDefined();
        expect(typeof result.optimalPlacementProposal).toBe('object');
        
        expect(result.workDifficultyAdjustmentRecommendations).toBeDefined();
        expect(Array.isArray(result.workDifficultyAdjustmentRecommendations)).toBe(true);
        
        expect(typeof result.notificationSent).toBe('boolean');
      } finally {
        warnSpy.mockRestore();
        jest.useRealTimers();
      }
    });
  });
});