import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-1005: リアルタイム進捗監視と遅延検知 - 生産性データ不足時の警告', () => {
  const userId = 'user-001';
  const siteIds = ['site-001'];
  const teamIds = ['team-001'];

  test('生産性パターンデータが3日分未満の場合、推奨内容の精度が低い可能性を警告する', async () => {
    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays: 2,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    // (1) monitoringExecutedAtが設定されていること
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    const executedDate = new Date(result.monitoringExecutedAt);
    expect(executedDate).toBeInstanceOf(Date);
    expect(executedDate.toString()).not.toBe('Invalid Date');

    // (2) delayRiskDetectedおよびnotificationSentが設定されていること
    expect(result.delayRiskDetected).toBeDefined();
    expect(typeof result.delayRiskDetected).toBe('boolean');
    expect(result.notificationSent).toBeDefined();
    expect(typeof result.notificationSent).toBe('boolean');

    // (3) recommendedAdjustmentsが空配列でない場合、その内容が返却されていること
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    if (result.recommendedAdjustments.length > 0) {
      result.recommendedAdjustments.forEach((adjustment) => {
        expect(adjustment.siteId).toBeDefined();
        expect(adjustment.adjustmentType).toBeDefined();
        expect(adjustment.adjustmentDescription).toBeDefined();
      });
    }

    // (4) analysisDetailsフィールドに警告メッセージが含まれていること
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails).not.toBeNull();
    const warningMessage = '生産性データが不足しているため、推奨精度が低い可能性があります';
    const analysisDetailsStr = JSON.stringify(result.analysisDetails);
    expect(analysisDetailsStr).toContain(warningMessage);

    // (5) 精度関連フィールドが0.5以下に設定されていること
    if (result.analysisDetails) {
      if ('dataQualityScore' in result.analysisDetails) {
        expect(result.analysisDetails.dataQualityScore).toBeLessThanOrEqual(50);
      }
    }

    // (6) overallDelayRiskScoreが設定されていること
    expect(result.overallDelayRiskScore).toBeDefined();
    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    // (7) affectedSitesが配列であること
    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
  });

  test('2日分のデータで呼び出された場合、出力に精度低下の警告が含まれる', async () => {
    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays: 2,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails).not.toBeNull();

    const analysisDetailsStr = JSON.stringify(result.analysisDetails);
    const hasWarning =
      analysisDetailsStr.includes('生産性データが不足') ||
      analysisDetailsStr.includes('精度が低い') ||
      analysisDetailsStr.includes('推奨精度');

    expect(hasWarning).toBe(true);
  });

  test('生産性データ不足時に精度フィールドが低い値に設定される', async () => {
    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays: 2,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails).not.toBeNull();

    if (result.analysisDetails && 'dataQualityScore' in result.analysisDetails) {
      expect(result.analysisDetails.dataQualityScore).toBeLessThanOrEqual(50);
    }
  });

  test('br-tx_1-003の制約2が適用されて警告が含まれる', async () => {
    const input = {
      userId,
      siteIds,
      teamIds,
      monitoringPeriodDays: 2,
      delayRiskThreshold: 60,
      includeProductivityAnalysis: true,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result.analysisDetails).toBeDefined();
    expect(result.analysisDetails).not.toBeNull();

    const analysisDetailsStr = JSON.stringify(result.analysisDetails);
    const warningMessage = '生産性データが不足しているため、推奨精度が低い可能性があります';
    
    expect(analysisDetailsStr).toContain(warningMessage);
  });
});