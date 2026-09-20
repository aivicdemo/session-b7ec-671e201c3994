import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import type {
  MonitorProgressAndDetectDelayRiskInput,
  MonitorProgressAndDetectDelayRiskOutput,
} from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

// モックの型定義
interface MockFunction {
  mockResolvedValue: (value: unknown) => MockFunction;
  mockReturnValue: (value: unknown) => MockFunction;
}

describe('SCEN-996: キャッシュ経過時間が5分超過時の手動入力モード切り替え', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('キャッシュの経過時間が5分を超える場合、手動入力モードに切り替え、現場リーダーに手動データ入力を指示する', async () => {
    // 前提条件：キャッシュの最終更新時刻を現在時刻より5分以上前に設定
    const now = new Date();
    const cacheExpiredTime = new Date(now.getTime() - 5 * 60 * 1000 - 30 * 1000); // 5分30秒前

    // 入力データの準備
    const input: MonitorProgressAndDetectDelayRiskInput = {
      userId: 'user-001',
      siteIds: ['site-A'],
      teamIds: ['team-1'],
      monitoringPeriodDays: 7,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    // モック関数の設定
    const authenticateUserMock = jest
      .spyOn(progressMonitoring, 'authenticateUser' as any)
      .mockResolvedValue({ authenticated: true, userId: 'user-001' });

    const authorizeUserActionMock = jest
      .spyOn(progressMonitoring, 'authorizeUserAction' as any)
      .mockResolvedValue({ authorized: true, permission: 'monitor_progress' });

    const validateInputDataMock = jest
      .spyOn(progressMonitoring, 'validateInputData' as any)
      .mockResolvedValue({ valid: true, errors: [] });

    const findProductivityDataMock = jest
      .spyOn(progressMonitoring, 'findProductivityDataBySiteAndPeriod' as any)
      .mockResolvedValue([
        {
          siteId: 'site-A',
          teamId: 'team-1',
          workDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          productivityRate: 75,
          qualityScore: 85,
        },
      ]);

    const aggregateProgressMock = jest
      .spyOn(progressMonitoring, 'aggregateProgressDataBySite' as any)
      .mockResolvedValue({
        siteId: 'site-A',
        siteName: 'Site A',
        currentProgressRate: 45,
        plannedProgressRate: 60,
        remainingDays: 3,
        totalWorkload: 100,
        currentTeamCapacity: 20,
        affectedTeams: ['team-1'],
        cacheLastUpdatedAt: cacheExpiredTime.toISOString(),
      });

    const calculateRiskScoreMock = jest
      .spyOn(progressMonitoring, 'calculateDelayRiskScore' as any)
      .mockResolvedValue({
        siteId: 'site-A',
        delayRiskScore: 65,
        riskLevel: 'HIGH',
        progressGapPercentage: -15,
        requiredDailyProgressRate: 18.33,
        calculatedAt: now.toISOString(),
      });

    const identifyAffectedMock = jest
      .spyOn(progressMonitoring, 'identifyAffectedSitesAndAdjustments' as any)
      .mockResolvedValue({
        affectedSites: [
          {
            siteId: 'site-A',
            siteName: 'Site A',
            delayRiskScore: 65,
            currentProgressRate: 45,
            plannedProgressRate: 60,
            progressGapPercentage: -15,
            estimatedDeliveryDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDeliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            remainingDays: 3,
            affectedTeams: ['team-1'],
            averageProductivityRate: 75,
          },
        ],
        recommendedAdjustments: [
          {
            siteId: 'site-A',
            adjustmentType: 'manual_input_required',
            adjustmentDescription:
              '手動入力モードに切り替えてください。現場リーダーに手動データ入力を指示して、リアルタイム進捗データを更新してください。',
            requiredPersonnelCount: undefined,
            requiredSkillLevel: undefined,
            priorityWorkTypes: [],
            estimatedImpactOnDelivery: 0,
            urgencyLevel: 'critical',
            recommendedExecutionDate: now.toISOString(),
          },
        ],
        adjustmentSummary: {
          totalAffectedSites: 1,
          totalRequiredPersonnel: 0,
          adjustmentTypes: ['manual_input_required'],
          estimatedOverallDeliveryImpact: 0,
          identifiedAt: now.toISOString(),
        },
        feasibilityAssessment: {
          isFullyFeasible: true,
          feasibleAdjustmentCount: 1,
          infeasibleAdjustments: [],
          constraintFactors: [],
        },
      });

    const sendNotificationMock = jest
      .spyOn(progressMonitoring, 'sendProgressDelayRiskNotification' as any)
      .mockResolvedValue({ sent: true, notificationId: 'notif-001' });

    // 処理の実行
    const output: MonitorProgressAndDetectDelayRiskOutput = await monitorProgressAndDetectDelayRisk(input);

    // ステップ3: 認証処理の検証
    expect(authenticateUserMock).toHaveBeenCalledWith('user-001');

    // ステップ4: 権限確認処理の検証
    expect(authorizeUserActionMock).toHaveBeenCalledWith('user-001', 'monitor_progress');

    // ステップ5: 入力データ検証処理の検証
    expect(validateInputDataMock).toHaveBeenCalledWith(input);

    // ステップ6: 生産性データ取得処理の検証
    expect(findProductivityDataMock).toHaveBeenCalledWith('site-A', expect.any(Date), expect.any(Date));

    // ステップ7: 進捗データ集約処理の検証
    expect(aggregateProgressMock).toHaveBeenCalled();

    // ステップ8: スコア計算処理の検証
    expect(calculateRiskScoreMock).toHaveBeenCalled();

    // ステップ9: 影響分析処理の検証
    expect(identifyAffectedMock).toHaveBeenCalled();

    // ステップ10: 通知送信処理の検証
    expect(sendNotificationMock).toHaveBeenCalled();

    // 出力型の検証
    expect(output).toBeDefined();

    // (1) delayRiskDetected=true
    expect(output.delayRiskDetected).toBe(true);

    // (2) overallDelayRiskScore=65
    expect(output.overallDelayRiskScore).toBe(65);

    // (3) affectedSites に siteId='site-A' のアイテムが含まれていること
    expect(output.affectedSites).toBeDefined();
    expect(output.affectedSites.length).toBeGreaterThan(0);
    const affectedSiteA = output.affectedSites.find((site) => site.siteId === 'site-A');
    expect(affectedSiteA).toBeDefined();
    expect(affectedSiteA?.siteId).toBe('site-A');

    // (4) recommendedAdjustments に siteId='site-A' かつ adjustmentType='manual_input_required' のアイテムが含まれていること
    expect(output.recommendedAdjustments).toBeDefined();
    expect(output.recommendedAdjustments.length).toBeGreaterThan(0);
    const manualInputAdjustment = output.recommendedAdjustments.find(
      (adj) => adj.siteId === 'site-A' && adj.adjustmentType === 'manual_input_required'
    );
    expect(manualInputAdjustment).toBeDefined();
    expect(manualInputAdjustment?.siteId).toBe('site-A');
    expect(manualInputAdjustment?.adjustmentType).toBe('manual_input_required');

    // (5) notificationSent=true
    expect(output.notificationSent).toBe(true);

    // (6) 通知内容に『手動入力モードに切り替え』と『現場リーダーに手動データ入力を指示』に相当する文言が含まれていること
    const adjustment = output.recommendedAdjustments.find((adj) => adj.siteId === 'site-A');
    expect(adjustment).toBeDefined();
    expect(adjustment?.adjustmentDescription).toMatch(/手動入力モードに切り替え/);
    expect(adjustment?.adjustmentDescription).toMatch(/現場リーダーに手動データ入力を指示/);

    // (7) monitoringExecutedAt が ISO 8601 形式の有効な日時文字列であること
    expect(output.monitoringExecutedAt).toBeDefined();
    expect(typeof output.monitoringExecutedAt).toBe('string');
    const executedDate = new Date(output.monitoringExecutedAt);
    expect(executedDate.toString()).not.toBe('Invalid Date');
    expect(output.monitoringExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});