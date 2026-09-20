import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('作業進捗・人員配置最適化エンジン - SCEN-005', () => {
  describe('エラー系：推奨配置を実現する利用可能な作業者が不足している場合', () => {
    it('InsufficientAvailableWorkersErrorが発生する', async () => {
      // テスト前提：スタブ関数群の準備
      const mockMonitorAndJudgeDelayRisk = jest.fn();
      const mockGenerateAllocationPlans = jest.fn();
      const mockJudgeAllocationPlanApprovalWithCriteria = jest.fn();
      const mockDeliverAllocationPlanAndWorkInstructions = jest.fn();
      const mockAuthorizeOperation = jest.fn();
      const mockRecordOperationAudit = jest.fn();
      const mockDeliverAllocationInstructionToFieldLeader = jest.fn();
      const mockFetchProgressData = jest.fn();
      const mockFetchProductivityData = jest.fn();

      // 進捗データ取得のスタブを準備
      // 現在時刻から遡って60分間の進捗データ（拠点A・チームX、チームY）と生産性データ（作業者5名、スキルレベル混在）
      mockFetchProgressData.mockResolvedValue([
        {
          progressDataId: 'progress-1',
          workInstructionId: 'instruction-1',
          facilityId: 'facility-A',
          teamId: 'team-X',
          progressDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedQuantity: 100,
          actualQuantity: 40,
          completionRate: 40,
          delayFlag: true,
          delayDays: 2,
        },
        {
          progressDataId: 'progress-2',
          workInstructionId: 'instruction-2',
          facilityId: 'facility-A',
          teamId: 'team-Y',
          progressDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedQuantity: 100,
          actualQuantity: 35,
          completionRate: 35,
          delayFlag: true,
          delayDays: 2.5,
        },
      ]);

      mockFetchProductivityData.mockResolvedValue([
        {
          productivityDataId: 'prod-1',
          workerId: 'worker-1',
          facilityId: 'facility-A',
          teamId: 'team-X',
          workDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedCount: 25,
          productivityRate: 85,
          qualityScore: 80,
          skillLevel: 'intermediate',
        },
        {
          productivityDataId: 'prod-2',
          workerId: 'worker-2',
          facilityId: 'facility-A',
          teamId: 'team-X',
          workDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedCount: 20,
          productivityRate: 75,
          qualityScore: 75,
          skillLevel: 'beginner',
        },
        {
          productivityDataId: 'prod-3',
          workerId: 'worker-3',
          facilityId: 'facility-A',
          teamId: 'team-Y',
          workDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedCount: 18,
          productivityRate: 72,
          qualityScore: 70,
          skillLevel: 'beginner',
        },
        {
          productivityDataId: 'prod-4',
          workerId: 'worker-4',
          facilityId: 'facility-A',
          teamId: 'team-Y',
          workDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedCount: 17,
          productivityRate: 70,
          qualityScore: 68,
          skillLevel: 'beginner',
        },
        {
          productivityDataId: 'prod-5',
          workerId: 'worker-5',
          facilityId: 'facility-A',
          teamId: 'team-X',
          workDate: new Date(Date.now() - 30 * 60000).toISOString(),
          plannedWorkHours: 8,
          actualWorkHours: 8,
          completedCount: 22,
          productivityRate: 78,
          qualityScore: 77,
          skillLevel: 'advanced',
        },
      ]);

      // authorizeOperation は正常系を返すように設定
      mockAuthorizeOperation.mockResolvedValue({
        isAuthorized: true,
        executorUserId: 'user-001',
        timestamp: new Date().toISOString(),
      });

      // monitorAndJudgeDelayRisk のスタブ設定
      // リスクスコア65（閾値60超過）を検知
      mockMonitorAndJudgeDelayRisk.mockResolvedValue({
        detectionTimestamp: new Date().toISOString(),
        delayDetected: true,
        affectedFacilities: [
          {
            facilityId: 'facility-A',
            facilityName: 'A拠点',
            riskScore: 65,
            riskRank: 1,
            delayReasons: ['insufficient_personnel', 'low_productivity'],
            affectedTeams: [
              {
                teamId: 'team-X',
                teamName: 'チームX',
                progressRate: 40,
                plannedProgressRate: 60,
                delayDays: 2,
                qualityScore: 75,
              },
              {
                teamId: 'team-Y',
                teamName: 'チームY',
                progressRate: 35,
                plannedProgressRate: 60,
                delayDays: 2.5,
                qualityScore: 70,
              },
            ],
          },
        ],
        qualityVarianceDetected: true,
        overallRiskScore: 65,
      });

      // generateAllocationPlans のスタブ設定
      // 必要な利用可能作業者数が8名だが、実際には4名のみ
      // InsufficientAvailableWorkersError をスロー
      const insufficientWorkersError = new Error('推奨配置を実現する利用可能な作業者が不足しています。');
      insufficientWorkersError.name = 'InsufficientAvailableWorkersError';
      mockGenerateAllocationPlans.mockRejectedValue(insufficientWorkersError);

      // AI クライアントのモック設定
      const mockAiClient = {
        monitorAndJudgeDelayRisk: mockMonitorAndJudgeDelayRisk,
        generateAllocationPlans: mockGenerateAllocationPlans,
        judgeAllocationPlanApprovalWithCriteria: mockJudgeAllocationPlanApprovalWithCriteria,
        deliverAllocationPlanAndWorkInstructions: mockDeliverAllocationPlanAndWorkInstructions,
        authorizeOperation: mockAuthorizeOperation,
        recordOperationAudit: mockRecordOperationAudit,
        deliverAllocationInstructionToFieldLeader: mockDeliverAllocationInstructionToFieldLeader,
        fetchProgressData: mockFetchProgressData,
        fetchProductivityData: mockFetchProductivityData,
      };

      // runTx1Imp1Agent を呼び出す
      const input = {
        executorUserId: 'user-001',
        targetFacilityIds: ['facility-A'],
        targetTeamIds: ['team-X', 'team-Y'],
        monitoringWindowMinutes: 60,
        delayRiskThreshold: 60,
        qualityVarianceThreshold: 15,
        autoApprovalEnabled: true,
      };

      // 例外がスロー（throw）されることを待機して、出力型Tx1Imp1AgentOutputが返されないことを検証
      let thrownError: any;
      try {
        const result = await runTx1Imp1Agent(input, mockAiClient);
        // 出力が返された場合、テストが失敗する（例外が伝播すべき）
        expect(result).toBeUndefined();
      } catch (error: any) {
        thrownError = error;
      }

      // InsufficientAvailableWorkersError がスロー（throw）されたことを検証
      expect(thrownError).toBeDefined();
      expect(thrownError.name).toBe('InsufficientAvailableWorkersError');
      expect(thrownError.message).toBe('推奨配置を実現する利用可能な作業者が不足しています。');

      // deliverAllocationPlanAndWorkInstructions が呼び出されていないことを検証
      expect(mockDeliverAllocationPlanAndWorkInstructions).not.toHaveBeenCalled();

      // deliverAllocationInstructionToFieldLeader が呼び出されていないことを検証
      expect(mockDeliverAllocationInstructionToFieldLeader).not.toHaveBeenCalled();

      // monitorAndJudgeDelayRisk は呼び出されている（エラー前に実行される）
      expect(mockMonitorAndJudgeDelayRisk).toHaveBeenCalled();

      // generateAllocationPlans は呼び出されている（エラーがここで発生）
      expect(mockGenerateAllocationPlans).toHaveBeenCalled();

      // DeliveryInstructionFailureError は発生していない
      // （他のエラーが発生していることを確認することで、DeliveryInstructionFailureErrorが発生していないことを確認）
      expect(thrownError.name).not.toBe('DeliveryInstructionFailureError');
    });
  });
});