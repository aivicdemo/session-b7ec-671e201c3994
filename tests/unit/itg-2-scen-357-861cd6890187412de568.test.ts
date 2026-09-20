import {
  analyzeBusyPeriodProductivityAndProposePlacement,
  AnalyzeBusyPeriodProductivityAndProposePlacementInput,
} from '../../src/logic/busy-period-productivity-analysis';

describe('SCEN-357: 繁忙期の受注急増を検知した時点で複数チームの進捗状況と生産性パターンを自動分析', () => {
  it('過去の作業実績から作業種別ごとの平均処理時間・完了数・エラー率・習熟度を抽出し、現在進捗と照合して遅延リスクを判定できる', async () => {
    // 準備：過去30日間の作業実績データを持つ3名の作業者とタスクデータ、受注データを定義
    const input: AnalyzeBusyPeriodProductivityAndProposePlacementInput = {
      targetTeamIds: ['team-001', 'team-002'],
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      currentProgressDataSnapshot: {
        tasks: [
          {
            taskId: 'task-1',
            taskType: '梱包',
            assignedWorkerId: 'worker-B',
            progressRate: 60,
            elapsedMinutes: 30,
            estimatedRemainingMinutes: 60,
            delayRiskHigh: false,
          },
          {
            taskId: 'task-2',
            taskType: '仕分け',
            assignedWorkerId: 'worker-A',
            progressRate: 40,
            elapsedMinutes: 45,
            estimatedRemainingMinutes: 45,
            delayRiskHigh: true,
          },
          {
            taskId: 'task-3',
            taskType: '検品',
            assignedWorkerId: 'worker-C',
            progressRate: 70,
            elapsedMinutes: 25,
            estimatedRemainingMinutes: 50,
            delayRiskHigh: false,
          },
          {
            taskId: 'task-4',
            taskType: '梱包',
            assignedWorkerId: 'worker-C',
            progressRate: 50,
            elapsedMinutes: 20,
            estimatedRemainingMinutes: 30,
            delayRiskHigh: true,
          },
          {
            taskId: 'task-5',
            taskType: '仕分け',
            assignedWorkerId: 'worker-B',
            progressRate: 80,
            elapsedMinutes: 35,
            estimatedRemainingMinutes: 40,
            delayRiskHigh: false,
          },
        ],
        wmsOrderSnapshot: {
          orderQuantityIncreased: true,
          highPriorityTasksCount: 4,
          totalOrderCount: 15,
        },
        teamComposition: {
          'team-001': {
            totalCapacity: 300,
            assignedWorkerCount: 3,
          },
          'team-002': {
            totalCapacity: 280,
            assignedWorkerCount: 3,
          },
        },
      },
      requestedByUserId: 'user-123',
    };

    // 対象公開処理を呼び出す
    const result = await analyzeBusyPeriodProductivityAndProposePlacement(input);

    // 検証：analysisExecutedAtがISO 8601形式の実行日時であることを確認
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 検証：multiTeamProgressSummaryが複数チーム別の進捗状況を含むことを確認
    expect(result.multiTeamProgressSummary).toBeDefined();
    expect(result.multiTeamProgressSummary).toHaveLength(2);
    const team001Summary = result.multiTeamProgressSummary.find(
      (s) => s.teamId === 'team-001'
    );
    const team002Summary = result.multiTeamProgressSummary.find(
      (s) => s.teamId === 'team-002'
    );
    expect(team001Summary).toBeDefined();
    expect(team002Summary).toBeDefined();
    expect(team001Summary?.progressRate).toBeCloseTo(65, 1);
    expect(team002Summary?.progressRate).toBeCloseTo(72, 1);

    // 検証：productivityPatternsByWorkerが作業者個人の過去作業実績を含むことを確認
    expect(result.productivityPatternsByWorker).toBeDefined();
    expect(result.productivityPatternsByWorker.length).toBeGreaterThanOrEqual(3);

    // 作業者Aの生産性パターン検証：梱包作業の具体的な数値
    const workerAPatterns = result.productivityPatternsByWorker.find(
      (p) => p.workerId === 'worker-A'
    );
    expect(workerAPatterns).toBeDefined();
    expect(workerAPatterns?.workTypeDistribution).toBeDefined();
    expect(workerAPatterns?.proficiencyLevel).toBe('expert');
    expect(workerAPatterns?.qualityScore).toBeCloseTo(98, 5); // エラー率2%から逆算
    expect(workerAPatterns?.averageProductivityRate).toBeCloseTo(120, 5); // 平均完了数120件

    // 作業者Bの生産性パターン検証：仕分け作業の具体的な数値
    const workerBPatterns = result.productivityPatternsByWorker.find(
      (p) => p.workerId === 'worker-B'
    );
    expect(workerBPatterns).toBeDefined();
    expect(workerBPatterns?.proficiencyLevel).toBe('intermediate');
    expect(workerBPatterns?.qualityScore).toBeCloseTo(97, 5); // エラー率3%から逆算
    expect(workerBPatterns?.averageProductivityRate).toBeCloseTo(100, 5); // 平均完了数100件

    // 作業者Cの生産性パターン検証：検品作業の具体的な数値
    const workerCPatterns = result.productivityPatternsByWorker.find(
      (p) => p.workerId === 'worker-C'
    );
    expect(workerCPatterns).toBeDefined();
    expect(workerCPatterns?.proficiencyLevel).toBe('beginner');
    expect(workerCPatterns?.qualityScore).toBeCloseTo(96, 5); // エラー率4%から逆算
    expect(workerCPatterns?.averageProductivityRate).toBeCloseTo(110, 5); // 平均完了数110件

    // 検証：delayRiskAssessmentが複数タスク別の遅延リスク判定を含むことを確認
    expect(result.delayRiskAssessment).toBeDefined();
    expect(Array.isArray(result.delayRiskAssessment)).toBe(true);
    expect(result.delayRiskAssessment.length).toBeGreaterThanOrEqual(2);

    // タスク2の遅延リスク評価を検証：リスクスコア92、高リスク、推定遅延15分、根本原因を確認
    const task2RiskAssessment = result.delayRiskAssessment.find(
      (ra: any) => ra.taskId === 'task-2'
    );
    expect(task2RiskAssessment).toBeDefined();
    if (task2RiskAssessment) {
      expect(task2RiskAssessment.delayRiskScore).toBe(92);
      expect(task2RiskAssessment.delayRiskLevel).toMatch(/HIGH|CRITICAL/);
      expect(task2RiskAssessment.estimatedDelayMinutes).toBe(15);
      expect(typeof task2RiskAssessment.rootCause).toBe('string');
      expect(task2RiskAssessment.rootCause.length).toBeGreaterThan(0);
      // 根本原因に作業者Bのスキルミスマッチについての説明が含まれることを確認
      expect(task2RiskAssessment.rootCause).toContain('作業者B');
      expect(task2RiskAssessment.rootCause).toContain('仕分け');
      expect(task2RiskAssessment.rootCause).toContain('中級');
      expect(task2RiskAssessment.rootCause).toContain('45分');
      expect(task2RiskAssessment.rootCause).toContain('完了');
    }

    // タスク4の遅延リスク評価を検証：リスクスコア85、高リスク、推定遅延10分、根本原因を確認
    const task4RiskAssessment = result.delayRiskAssessment.find(
      (ra: any) => ra.taskId === 'task-4'
    );
    expect(task4RiskAssessment).toBeDefined();
    if (task4RiskAssessment) {
      expect(task4RiskAssessment.delayRiskScore).toBe(85);
      expect(task4RiskAssessment.delayRiskLevel).toMatch(/HIGH|CRITICAL/);
      expect(task4RiskAssessment.estimatedDelayMinutes).toBe(10);
      expect(typeof task4RiskAssessment.rootCause).toBe('string');
      expect(task4RiskAssessment.rootCause.length).toBeGreaterThan(0);
      // 根本原因に作業者Cの習熟度と難度不適切についての説明が含まれることを確認
      expect(task4RiskAssessment.rootCause).toContain('作業者C');
      expect(task4RiskAssessment.rootCause).toContain('初級');
      expect(task4RiskAssessment.rootCause).toContain('標準難度');
      expect(task4RiskAssessment.rootCause).toContain('不適切');
      expect(task4RiskAssessment.rootCause).toContain('梱包');
    }

    // 検証：optimalPlacementProposalが高リスクタスクに対する最適人員配置案を含むことを確認
    expect(result.optimalPlacementProposal).toBeDefined();
    expect(result.optimalPlacementProposal).toHaveProperty('placementProposals');
    expect(Array.isArray(result.optimalPlacementProposal.placementProposals)).toBe(
      true
    );
    expect(
      result.optimalPlacementProposal.placementProposals.length
    ).toBeGreaterThanOrEqual(2);

    // タスク2の配置案を検証：推奨割当作業者A、推奨作業種別『仕分け』、期待完了時間『32分』、期待生産性向上率『25%』、配置根拠を確認
    const task2Proposal = result.optimalPlacementProposal.placementProposals.find(
      (p: any) => p.taskId === 'task-2'
    );
    expect(task2Proposal).toBeDefined();
    if (task2Proposal) {
      expect(task2Proposal).toHaveProperty('placementProposalId');
      expect(task2Proposal).toHaveProperty('expectedProductivityImprovement');
      expect(task2Proposal).toHaveProperty('recommendedWorkTypeId');
      expect(task2Proposal).toHaveProperty('placementReason');
      expect(task2Proposal).toHaveProperty('expectedCompletionTimeMinutes');
      expect(task2Proposal.expectedProductivityImprovement).toBe(25); // 期待生産性向上率25%
      expect(task2Proposal.expectedCompletionTimeMinutes).toBe(32); // 期待完了時間32分
      expect(task2Proposal.recommendedWorkerId).toBe('worker-A'); // 推奨割当作業者A
      expect(task2Proposal.recommendedWorkTypeId).toBe('sorting'); // 仕分け作業タイプ
      expect(typeof task2Proposal.placementReason).toBe('string');
      expect(task2Proposal.placementReason.length).toBeGreaterThan(0);
      // 配置根拠に作業者スキルと完了時間の具体的な根拠が含まれることを確認
      expect(task2Proposal.placementReason).toContain('worker-A');
      expect(task2Proposal.placementReason).toContain('32');
      expect(task2Proposal.placementReason).toContain('仕分け');
      expect(task2Proposal.placementReason).toContain('効率');
    }

    // タスク4の配置案を検証：推奨割当作業者A、推奨作業種別『梱包』、期待完了時間『28分』、期待生産性向上率『20%』、配置根拠を確認
    const task4Proposal = result.optimalPlacementProposal.placementProposals.find(
      (p: any) => p.taskId === 'task-4'
    );
    expect(task4Proposal).toBeDefined();
    if (task4Proposal) {
      expect(task4Proposal).toHaveProperty('placementProposalId');
      expect(task4Proposal).toHaveProperty('expectedProductivityImprovement');
      expect(task4Proposal).toHaveProperty('recommendedWorkTypeId');
      expect(task4Proposal).toHaveProperty('placementReason');
      expect(task4Proposal).toHaveProperty('expectedCompletionTimeMinutes');
      expect(task4Proposal.expectedProductivityImprovement).toBe(20); // 期待生産性向上率20%
      expect(task4Proposal.expectedCompletionTimeMinutes).toBe(28); // 期待完了時間28分
      expect(task4Proposal.recommendedWorkerId).toBe('worker-A'); // 推奨割当作業者A
      expect(task4Proposal.recommendedWorkTypeId).toBe('packing'); // 梱包作業タイプ
      expect(typeof task4Proposal.placementReason).toBe('string');
      expect(task4Proposal.placementReason.length).toBeGreaterThan(0);
      // 配置根拠に作業者スキルと完了時間の具体的な根拠が含まれることを確認
      expect(task4Proposal.placementReason).toContain('worker-A');
      expect(task4Proposal.placementReason).toContain('28');
      expect(task4Proposal.placementReason).toContain('梱包');
      expect(task4Proposal.placementReason).toContain('15分');
      expect(task4Proposal.placementReason).toContain('熟練');
      expect(task4Proposal.placementReason).toContain('納期');
    }

    // 検証：workDifficultyAdjustmentRecommendationsが作業者別の難度調整推奨を含むことを確認
    expect(result.workDifficultyAdjustmentRecommendations).toBeDefined();
    expect(
      Array.isArray(result.workDifficultyAdjustmentRecommendations)
    ).toBe(true);
    expect(
      result.workDifficultyAdjustmentRecommendations.length
    ).toBeGreaterThanOrEqual(1);

    // 作業者Cの難度調整推奨を検証：現在難度『標準』→推奨難度『初級』、段階的調整を含む調整理由
    const workerCAdjustment = result.workDifficultyAdjustmentRecommendations.find(
      (r) => r.workerId === 'worker-C'
    );
    expect(workerCAdjustment).toBeDefined();
    if (workerCAdjustment) {
      expect(workerCAdjustment.currentDifficultyLevel).toBe('standard');
      expect(workerCAdjustment.recommendedDifficultyLevel).toBe('beginner');
      expect(workerCAdjustment.adjustmentDirection).toBe('down');
      expect(typeof workerCAdjustment.justificationReason).toBe('string');
      expect(workerCAdjustment.justificationReason.length).toBeGreaterThan(0);
      // 調整理由に具体的な理由（習熟度初級、エラー率4%、段階的調整、スキル向上）が含まれることを確認
      expect(workerCAdjustment.justificationReason).toContain('初級');
      expect(workerCAdjustment.justificationReason).toContain('エラー率');
      expect(workerCAdjustment.justificationReason).toContain('4%');
      expect(workerCAdjustment.justificationReason).toContain('標準難度');
      expect(workerCAdjustment.justificationReason).toContain('段階');
      expect(workerCAdjustment.justificationReason).toContain('スキル');
      expect(workerCAdjustment.justificationReason).toContain('向上');
    }

    // 検証：notificationSentがtrueであることを確認
    expect(result.notificationSent).toBe(true);

    // 検証：過去実績データが作業種別ごとの具体的な平均処理時間・完了数・エラー率で正確に抽出されていることを確認
    expect(result.productivityPatternsByWorker).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workerId: 'worker-A',
          proficiencyLevel: 'expert',
          averageProductivityRate: expect.any(Number),
          qualityScore: expect.any(Number),
        }),
        expect.objectContaining({
          workerId: 'worker-B',
          proficiencyLevel: 'intermediate',
          averageProductivityRate: expect.any(Number),
          qualityScore: expect.any(Number),
        }),
        expect.objectContaining({
          workerId: 'worker-C',
          proficiencyLevel: 'beginner',
          averageProductivityRate: expect.any(Number),
          qualityScore: expect.any(Number),
        }),
      ])
    );

    // 検証：タスク2とタスク4のリスク評価が正確に2件含まれていることを確認
    const delayRiskTasks = result.delayRiskAssessment.filter(
      (ra: any) => ra.taskId === 'task-2' || ra.taskId === 'task-4'
    );
    expect(delayRiskTasks.length).toBe(2);
  });
});