import { assessDeliveryRiskAndProposeAdjustments } from '../../src/logic/delivery-risk-assessment';
import * as deliveryRiskAssessmentModule from '../../src/logic/delivery-risk-assessment';

describe('SCEN-285: 納期リスク評価と調整提案の自動生成', () => {
  let validateInputDataStub: jest.SpyInstance;
  let calculateDateTimeValuesStub: jest.SpyInstance;
  let findProductivityDataBySiteAndPeriodStub: jest.SpyInstance;
  let calculateDeliveryRiskScoreStub: jest.SpyInstance;
  let identifyAffectedSitesRequiringAdjustmentStub: jest.SpyInstance;
  let generateDeliveryAdjustmentProposalsStub: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    validateInputDataStub = jest.spyOn(deliveryRiskAssessmentModule, 'validateInputData' as any).mockReturnValue(true);
    
    calculateDateTimeValuesStub = jest.spyOn(deliveryRiskAssessmentModule, 'calculateDateTimeValues' as any).mockReturnValue({
      remainingHours: 72,
      remainingDays: 3,
    });

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    findProductivityDataBySiteAndPeriodStub = jest.spyOn(deliveryRiskAssessmentModule, 'findProductivityDataBySiteAndPeriod' as any).mockReturnValue([
      {
        date: oneWeekAgo,
        completionRate: 0.5,
        workforceCount: 5,
      },
      {
        date: threeHoursAgo,
        completionRate: 0.65,
        workforceCount: 6,
      },
    ]);

    calculateDeliveryRiskScoreStub = jest.spyOn(deliveryRiskAssessmentModule, 'calculateDeliveryRiskScore' as any).mockReturnValue({
      siteId: 'SITE-001',
      riskScore: 55,
      riskLevel: 'medium',
      remainingHours: 72,
      requiredCompletionRate: 0.75,
      projectedCompletionRate: 0.6,
    });

    identifyAffectedSitesRequiringAdjustmentStub = jest.spyOn(deliveryRiskAssessmentModule, 'identifyAffectedSitesRequiringAdjustment' as any).mockReturnValue({
      affectedSites: [
        {
          siteId: 'SITE-001',
          currentProgressRate: 45,
          predictedCompletionDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000),
          riskLevel: 'medium',
        },
        {
          siteId: 'SITE-002',
          currentProgressRate: 60,
          predictedCompletionDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
          riskLevel: 'low',
        },
      ],
      unaffectedSites: [],
    });

    generateDeliveryAdjustmentProposalsStub = jest.spyOn(deliveryRiskAssessmentModule, 'generateDeliveryAdjustmentProposals' as any).mockReturnValue({
      proposals: [
        {
          proposalId: 'PROP-001',
          targetSiteId: 'SITE-001',
          adjustmentType: 'personnel_addition',
          adjustmentDetails: {
            additionalPersonnel: 2,
            implementationStartTime: new Date(),
          },
          estimatedProductivityImprovement: 25,
          implementationPriority: 9,
          estimatedImplementationTime: 30,
        },
        {
          proposalId: 'PROP-002',
          targetSiteId: 'SITE-002',
          adjustmentType: 'priority_change',
          adjustmentDetails: {
            priorityLevel: 'high',
          },
          estimatedProductivityImprovement: 10,
          implementationPriority: 5,
          estimatedImplementationTime: 15,
        },
      ],
      estimatedSuccessProbability: 92,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('代表的な正常入力で納期リスクレベルと調整提案が返される', async () => {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const input = {
      siteIds: ['SITE-001', 'SITE-002'],
      deliveryDate: deliveryDate,
      currentProgressRateBysite: {
        'SITE-001': 45,
        'SITE-002': 60,
      },
      evaluationPeriodDays: 30,
      requestedByUserId: 'USER-123',
    };

    const result = await assessDeliveryRiskAndProposeAdjustments(input);

    expect(result).toBeDefined();
    expect(result.overallDeliveryRiskLevel).toBe('medium');
    expect(result.affectedSites).toBeDefined();
    expect(Array.isArray(result.affectedSites)).toBe(true);
    expect(result.affectedSites.length).toBeGreaterThanOrEqual(2);
    
    result.affectedSites.forEach((site) => {
      expect(site).toHaveProperty('siteId');
      expect(site).toHaveProperty('currentProgressRate');
      expect(site).toHaveProperty('predictedCompletionDate');
      expect(['low', 'medium', 'high', 'critical']).toContain(site.riskLevel);
    });

    expect(result.proposedAdjustments).toBeDefined();
    expect(Array.isArray(result.proposedAdjustments)).toBe(true);
    expect(result.proposedAdjustments.length).toBeGreaterThanOrEqual(2);

    result.proposedAdjustments.forEach((proposal) => {
      expect(proposal).toHaveProperty('proposalId');
      expect(proposal).toHaveProperty('targetSiteId');
      expect(['personnel_addition', 'priority_change', 'difficulty_adjustment', 'combined']).toContain(proposal.adjustmentType);
      expect(proposal).toHaveProperty('adjustmentDetails');
      expect(typeof proposal.estimatedProductivityImprovement).toBe('number');
      expect(proposal.estimatedProductivityImprovement).toBeGreaterThanOrEqual(0);
      expect(typeof proposal.implementationPriority).toBe('number');
      expect(proposal.implementationPriority).toBeGreaterThanOrEqual(1);
      expect(proposal.implementationPriority).toBeLessThanOrEqual(10);
      expect(typeof proposal.estimatedImplementationTime).toBe('number');
      expect(proposal.estimatedImplementationTime).toBeGreaterThan(0);
    });

    expect(typeof result.estimatedDeliverySuccessProbability).toBe('number');
    expect(result.estimatedDeliverySuccessProbability).toBeGreaterThanOrEqual(0);
    expect(result.estimatedDeliverySuccessProbability).toBeLessThanOrEqual(100);

    expect(result.evaluatedAt).toBeInstanceOf(Date);

    expect(validateInputDataStub).toHaveBeenCalled();
    expect(calculateDateTimeValuesStub).toHaveBeenCalled();
    expect(findProductivityDataBySiteAndPeriodStub).toHaveBeenCalled();
    expect(calculateDeliveryRiskScoreStub).toHaveBeenCalled();
    expect(identifyAffectedSitesRequiringAdjustmentStub).toHaveBeenCalled();
    expect(generateDeliveryAdjustmentProposalsStub).toHaveBeenCalled();
  });
});