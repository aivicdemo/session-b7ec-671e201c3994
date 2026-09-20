import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';

describe('SCEN-151: monitorProgressAndDetectDelayRisk with default parameters', () => {
  it('should apply default values when optional parameters are omitted', async () => {
    const userId = 'test-user-id';

    const input = {
      userId,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.monitoringExecutedAt).toBeDefined();
    expect(typeof result.monitoringExecutedAt).toBe('string');
    const parsedDate = new Date(result.monitoringExecutedAt);
    expect(isNaN(parsedDate.getTime())).toBe(false);

    expect(typeof result.delayRiskDetected).toBe('boolean');

    expect(Array.isArray(result.affectedSites)).toBe(true);
    if (result.affectedSites.length > 0) {
      result.affectedSites.forEach((site) => {
        expect(site.siteId).toBeDefined();
        expect(site.siteName).toBeDefined();
        expect(typeof site.delayRiskScore).toBe('number');
        expect(site.delayRiskScore).toBeGreaterThanOrEqual(0);
        expect(site.delayRiskScore).toBeLessThanOrEqual(100);
        expect(typeof site.currentProgressRate).toBe('number');
        expect(typeof site.plannedProgressRate).toBe('number');
        expect(typeof site.progressGapPercentage).toBe('number');
        expect(site.estimatedDeliveryDate).toBeDefined();
        expect(site.plannedDeliveryDate).toBeDefined();
        expect(typeof site.remainingDays).toBe('number');
        expect(Array.isArray(site.affectedTeams)).toBe(true);
      });
    }

    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    if (result.recommendedAdjustments.length > 0) {
      result.recommendedAdjustments.forEach((adjustment) => {
        expect(adjustment.siteId).toBeDefined();
        expect(adjustment.adjustmentType).toBeDefined();
        expect(adjustment.adjustmentDescription).toBeDefined();
        expect(typeof adjustment.estimatedImpactOnDelivery).toBe('number');
        expect(adjustment.urgencyLevel).toBeDefined();
        expect(adjustment.recommendedExecutionDate).toBeDefined();
      });
    }

    expect(typeof result.overallDelayRiskScore).toBe('number');
    expect(result.overallDelayRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallDelayRiskScore).toBeLessThanOrEqual(100);

    expect(typeof result.notificationSent).toBe('boolean');
    expect(result.notificationSent).toBe(true);

    expect(result.analysisDetails).toBeDefined();
    if (result.analysisDetails) {
      expect(result.analysisDetails.analysisStartDate).toBeDefined();
      expect(result.analysisDetails.analysisEndDate).toBeDefined();
      expect(typeof result.analysisDetails.totalSitesMonitored).toBe('number');
      expect(typeof result.analysisDetails.sitesWithDelayRisk).toBe('number');
      expect(typeof result.analysisDetails.averageProgressRate).toBe('number');
      expect(typeof result.analysisDetails.dataQualityScore).toBe('number');
      expect(result.analysisDetails.analysisReliability).toBeDefined();
    }
  });

  it('should use default monitoringPeriodDays=7 when omitted', async () => {
    const userId = 'test-user-id';

    const input = {
      userId,
      siteIds: ['site-1'],
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.analysisDetails).toBeDefined();
    if (result.analysisDetails) {
      const startDate = new Date(result.analysisDetails.analysisStartDate);
      const endDate = new Date(result.analysisDetails.analysisEndDate);
      const daysDifference = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDifference).toBeLessThanOrEqual(7);
      expect(daysDifference).toBeGreaterThanOrEqual(6);
    }
  });

  it('should use default delayRiskThreshold=60 for risk detection', async () => {
    const userId = 'test-user-id';

    const input = {
      userId,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.overallDelayRiskScore).toBeDefined();
    if (result.affectedSites.length > 0) {
      result.affectedSites.forEach((site) => {
        if (result.delayRiskDetected) {
          expect(site.delayRiskScore).toBeGreaterThanOrEqual(60);
        }
      });
    }
  });

  it('should include productivity analysis when includeProductivityAnalysis defaults to true', async () => {
    const userId = 'test-user-id';

    const input = {
      userId,
    };

    const result = await monitorProgressAndDetectDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.analysisDetails).toBeDefined();
    if (result.analysisDetails) {
      expect(result.analysisDetails.averageProductivityRate).toBeDefined();
    }
    if (result.affectedSites.length > 0) {
      result.affectedSites.forEach((site) => {
        if (site.averageProductivityRate !== undefined) {
          expect(typeof site.averageProductivityRate).toBe('number');
        }
      });
    }
  });
});