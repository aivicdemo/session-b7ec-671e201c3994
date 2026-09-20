import { analyzeBusyPeriodProductivityAndProposePlacement } from '../../src/logic/busy-period-productivity-analysis';
import { AnalyzeBusyPeriodProductivityAndProposePlacementInput } from '../../src/logic/busy-period-productivity-analysis';

describe('SCEN-362: 繁忙期の受注急増検知時の統合提案 - エッジケース', () => {
  describe('現在進行中のタスクデータが空の場合、例外が発生する', () => {
    it('should throw InsufficientProgressDataError with exact message when currentProgressDataSnapshot is empty', async () => {
      const input: AnalyzeBusyPeriodProductivityAndProposePlacementInput = {
        targetTeamIds: ['team-001', 'team-002'],
        analysisStartDate: '2024-01-01T00:00:00Z',
        analysisEndDate: '2024-01-31T23:59:59Z',
        currentProgressDataSnapshot: {
          tasks: [],
        },
        requestedByUserId: 'user-123',
      };

      await expect(
        analyzeBusyPeriodProductivityAndProposePlacement(input)
      ).rejects.toThrow(
        new Error('進捗データが不足しており、分析を実行できません。対象チームと期間を確認してください。')
      );
    });

    it('should throw InsufficientProgressDataError with exact message when currentProgressDataSnapshot contains no progress entries', async () => {
      const input: AnalyzeBusyPeriodProductivityAndProposePlacementInput = {
        targetTeamIds: ['team-001', 'team-002'],
        analysisStartDate: '2024-01-01T00:00:00Z',
        analysisEndDate: '2024-01-31T23:59:59Z',
        currentProgressDataSnapshot: {},
        requestedByUserId: 'user-123',
      };

      await expect(
        analyzeBusyPeriodProductivityAndProposePlacement(input)
      ).rejects.toThrow(
        new Error('進捗データが不足しており、分析を実行できません。対象チームと期間を確認してください。')
      );
    });
  });
});