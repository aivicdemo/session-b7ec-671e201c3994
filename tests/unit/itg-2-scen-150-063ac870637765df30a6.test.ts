import { monitorProgressAndDetectDelayRisk } from '../../src/logic/progress-monitoring';
import * as progressMonitoring from '../../src/logic/progress-monitoring';

jest.mock('../../src/logic/progress-monitoring', () => ({
  ...jest.requireActual('../../src/logic/progress-monitoring'),
  authenticateUser: jest.fn(),
  authorizeUserAction: jest.fn(),
  validateInputData: jest.fn(),
  aggregateProgressDataBySite: jest.fn(),
  calculateDelayRiskScore: jest.fn(),
  identifyAffectedSitesAndAdjustments: jest.fn(),
}));

describe('SCEN-150: monitorProgressAndDetectDelayRisk', () => {
  describe('when current completion rate already exceeds target value', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      (progressMonitoring.authenticateUser as jest.Mock).mockResolvedValue({
        userId: 'user-001',
        isValid: true,
      });

      (progressMonitoring.authorizeUserAction as jest.Mock).mockResolvedValue({
        hasPermission: true,
      });

      (progressMonitoring.validateInputData as jest.Mock).mockResolvedValue({
        isValid: true,
      });

      (progressMonitoring.aggregateProgressDataBySite as jest.Mock).mockResolvedValue({
        siteId: 'site-A',
        currentProgressRate: 95,
        plannedProgressRate: 80,
      });

      (progressMonitoring.calculateDelayRiskScore as jest.Mock).mockResolvedValue({
        delayRiskScore: 0,
        riskLevel: 'LOW',
      });

      (progressMonitoring.identifyAffectedSitesAndAdjustments as jest.Mock).mockResolvedValue({
        affectedSites: [],
        recommendedAdjustments: [],
      });
    });

    it('should return no delay risk detected and no adjustments needed', async () => {
      const userId = 'user-001';
      const siteIds = ['site-A'];
      const monitoringPeriodDays = 7;
      const delayRiskThreshold = 60;
      const includeProductivityAnalysis = true;

      const input = {
        userId,
        siteIds,
        monitoringPeriodDays,
        delayRiskThreshold,
        includeProductivityAnalysis,
      };

      const result = await monitorProgressAndDetectDelayRisk(input);

      expect(progressMonitoring.authenticateUser).toHaveBeenCalledWith(userId);
      expect(progressMonitoring.authorizeUserAction).toHaveBeenCalledWith(
        userId,
        'progress_monitoring_execution'
      );
      expect(progressMonitoring.validateInputData).toHaveBeenCalledWith(input);
      expect(progressMonitoring.aggregateProgressDataBySite).toHaveBeenCalledWith(
        siteIds,
        monitoringPeriodDays
      );
      expect(progressMonitoring.calculateDelayRiskScore).toHaveBeenCalled();
      expect(progressMonitoring.identifyAffectedSitesAndAdjustments).toHaveBeenCalled();

      expect(result.delayRiskDetected).toBe(false);
      expect(result.affectedSites).toEqual([]);
      expect(result.recommendedAdjustments).toEqual([]);
      expect(result.overallDelayRiskScore).toBe(0);
      expect(result.notificationSent).toBe(false);
      expect(result.monitoringExecutedAt).toBeTruthy();
      expect(typeof result.monitoringExecutedAt).toBe('string');
      const executedAtDate = new Date(result.monitoringExecutedAt);
      expect(executedAtDate instanceof Date && !isNaN(executedAtDate.getTime())).toBe(true);
    });
  });
});