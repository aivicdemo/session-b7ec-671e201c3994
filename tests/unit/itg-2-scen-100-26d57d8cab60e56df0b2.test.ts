import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('作業者生産性データ分析・配置最適化支援システム - SCEN-100', () => {
  describe('配置案生成に必要な最小限のデータが不足しているとき', () => {
    it('InsufficientDataForPlacementGeneration エラーを返す', async () => {
      // Arrange
      const orderVolumeIncreaseContext = {
        detectionTimestamp: '2024-01-15T10:00:00Z',
        orderVolumePercentageIncrease: 25,
        affectedTeamIds: ['team-001', 'team-002'],
        affectedSiteIds: ['site-001'],
        orderDeadlineDate: '2024-01-20',
      };

      const analysisStartDate = '2024-01-01';
      const analysisEndDate = '2024-01-15';
      const executingUserId = 'user-admin-001';
      const dataRetrievalTimeoutMs = 30000;
      const useCachedDataIfRetrievalFails = true;

      // Act
      const result = await runTx6Imp1Agent(
        {
          orderVolumeIncreaseContext,
          analysisStartDate,
          analysisEndDate,
          executingUserId,
          dataRetrievalTimeoutMs,
          useCachedDataIfRetrievalFails,
        },
        {
          analyzeBusyPeriodProductivityAndProposePlacement: async () => ({
            placementProposalId: null,
            proposedPlacementChanges: [],
            analysisResult: {
              multiTeamProgressData: [],
              productivityPatternsByWorker: [],
              placementValidityScore: 0,
              placementValidityReason: 'Insufficient data',
            },
            error: {
              code: 'InsufficientDataForPlacementGeneration',
              message: '配置案生成に必要なデータが不足しています。データ収集を継続します。',
              affectedComponent: 'PlacementProposalEngine',
              recoveryAction: 'データ収集期間の延長',
            },
          }),
          sendDeliveryInstructionToFieldLeaders: async () => ({
            status: 'failed',
            notifications: [],
          }),
          notifyAdministrator: async () => ({
            status: 'delivered',
          }),
        }
      );

      // Assert
      expect(result.executionStatus).toBe('failed');
      expect(result.placementProposalId).toBeNull();
      expect(result.proposedPlacementChanges).toEqual([]);
      expect(result.deliveryInstructionStatus).toBe('failed');
      expect(result.errorDetails).toBeTruthy();
      expect(result.errorDetails).toHaveLength(1);
      expect(result.errorDetails[0].errorCode).toBe(
        'InsufficientDataForPlacementGeneration'
      );
      expect(result.errorDetails[0].errorMessage).toContain(
        '配置案生成に必要なデータが不足しています'
      );
      expect(result.errorDetails[0].affectedComponent).toBeDefined();
      expect(result.errorDetails[0].recoveryAction).toBeDefined();
      expect(result.analysisResult).toBeDefined();
    });
  });
});