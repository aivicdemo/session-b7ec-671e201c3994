import { saveDelayRiskJudgment } from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation-common-calculation';

jest.mock('../../src/logic/validation-common-calculation');

describe('SCEN-982: riskJudgmentIdがnullまたはundefinedの場合、新規作成として処理される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validationModule.validateDateTimeRange as jest.Mock).mockReturnValue(undefined);
    (validationModule.validateNumericQuantity as jest.Mock).mockReturnValue(undefined);
    (validationModule.validateReferentialIntegrity as jest.Mock).mockReturnValue(undefined);
  });

  it('should create a new delay risk judgment record when riskJudgmentId is null', async () => {
    const input = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-01',
      teamId: 'TEAM-A',
      judgmentDateTime: '2025-01-15T10:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 5,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足',
      recommendedAction: '人員追加',
      createdBy: 'USER-001',
    };

    const result = await saveDelayRiskJudgment(input);

    expect(result).toBeDefined();
    expect(result.riskJudgmentId).not.toBeNull();
    expect(result.riskJudgmentId).not.toBeUndefined();
    expect(typeof result.riskJudgmentId).toBe('string');
    expect(result.riskJudgmentId.length).toBeGreaterThan(0);
    
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.facilityId).toBe('FAC-01');
    expect(result.teamId).toBe('TEAM-A');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.delayPredictionDays).toBe(5);
    expect(result.recommendedAction).toBe('人員追加');
    
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    
    expect(result.isNewRecord).toBe(true);

    expect(validationModule.validateDateTimeRange).toHaveBeenCalled();
    expect(validationModule.validateNumericQuantity).toHaveBeenCalled();
    expect(validationModule.validateReferentialIntegrity).toHaveBeenCalled();
  });

  it('should create a new delay risk judgment record when riskJudgmentId is undefined', async () => {
    const input = {
      riskJudgmentId: undefined,
      workInstructionId: 'WI-002',
      facilityId: 'FAC-02',
      teamId: 'TEAM-B',
      judgmentDateTime: '2025-01-15T11:00:00Z',
      riskLevel: 'MEDIUM',
      delayPredictionDays: 3,
      progressRate: 55,
      plannedProgressRate: 70,
      judgmentReason: '効率低下',
      recommendedAction: '優先度調整',
      createdBy: 'USER-002',
    };

    const result = await saveDelayRiskJudgment(input);

    expect(result).toBeDefined();
    expect(result.riskJudgmentId).not.toBeNull();
    expect(result.riskJudgmentId).not.toBeUndefined();
    expect(typeof result.riskJudgmentId).toBe('string');
    
    expect(result.workInstructionId).toBe('WI-002');
    expect(result.facilityId).toBe('FAC-02');
    expect(result.teamId).toBe('TEAM-B');
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.delayPredictionDays).toBe(3);
    expect(result.recommendedAction).toBe('優先度調整');
    
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    
    expect(result.isNewRecord).toBe(true);
  });

  it('should generate a valid unique ID and record creation timestamp for new records', async () => {
    const input = {
      riskJudgmentId: null,
      workInstructionId: 'WI-003',
      facilityId: 'FAC-03',
      teamId: 'TEAM-C',
      judgmentDateTime: '2025-01-15T12:00:00Z',
      riskLevel: 'LOW',
      delayPredictionDays: 1,
      progressRate: 80,
      plannedProgressRate: 85,
      judgmentReason: '軽微な遅延',
      recommendedAction: '継続監視',
      createdBy: 'USER-003',
    };

    const beforeTime = new Date();
    const result = await saveDelayRiskJudgment(input);
    const afterTime = new Date();

    expect(result.riskJudgmentId).toBeDefined();
    expect(typeof result.riskJudgmentId).toBe('string');
    expect(result.riskJudgmentId.length).toBeGreaterThan(0);
    
    const savedTime = new Date(result.savedAt);
    expect(savedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
    expect(savedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    
    expect(result.isNewRecord).toBe(true);
  });
});