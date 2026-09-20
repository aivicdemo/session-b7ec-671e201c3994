import {
  monitorAndJudgeDelayRisk,
  classifyDelayReason,
  MonitorAndJudgeDelayRiskInput,
  type ClassifyDelayReasonInput,
} from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-118: 現在の完了率が負の値または100を超える場合の例外処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('classifyDelayReason内でactualProgressRateが負の値の場合、例外を発生させる', () => {
    const classifyDelayReasonInput: ClassifyDelayReasonInput = {
      facilityId: 'FAC-001',
      teamId: undefined,
      plannedProgressRate: 50,
      actualProgressRate: -5,
      averageProductivityRate: 85,
      allocatedStaffCount: 5,
      requiredStaffCount: 5,
      workInstructionPriorityDistribution: {
        high: 10,
        medium: 20,
        low: 15,
      },
    };

    expect(() => classifyDelayReason(classifyDelayReasonInput)).toThrow(
      new Error('進捗データが不正です。完了率は0～100の範囲で入力してください')
    );
  });

  it('classifyDelayReason内でactualProgressRateが100を超える場合、例外を発生させる', () => {
    const classifyDelayReasonInput: ClassifyDelayReasonInput = {
      facilityId: 'FAC-002',
      teamId: undefined,
      plannedProgressRate: 80,
      actualProgressRate: 105,
      averageProductivityRate: 90,
      allocatedStaffCount: 6,
      requiredStaffCount: 5,
      workInstructionPriorityDistribution: {
        high: 12,
        medium: 18,
        low: 10,
      },
    };

    expect(() => classifyDelayReason(classifyDelayReasonInput)).toThrow(
      new Error('進捗データが不正です。完了率は0～100の範囲で入力してください')
    );
  });

  it('monitorAndJudgeDelayRisk呼び出し時に、スタブが正常なデータを返す場合、処理が成功する', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-123',
    };

    // monitorAndJudgeDelayRisk実装内で呼び出される処理をスタブ化
    const getRecentProgressDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getRecentProgressDataByWorkInstruction')
      .mockResolvedValue([
        {
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          currentProgressRate: 50,
          plannedProgressRate: 50,
          remainingWorkDays: 5,
        },
      ]);

    const getLatestProductivityDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getLatestProductivityDataByWorker')
      .mockResolvedValue([
        {
          workerId: 'WORKER-001',
          productivityRate: 85,
          qualityScore: 90,
          allocatedStaffCount: 5,
          requiredStaffCount: 5,
        },
      ]);

    const calculateDelayRiskScoreSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'calculateDelayRiskScore')
      .mockReturnValue(30);

    const classifyDelayReasonSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'classifyDelayReason')
      .mockReturnValue({
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        insufficientStaffContribution: 20,
        efficiencyDeclineContribution: 40,
        priorityMisalignmentContribution: 40,
        primaryDelayReason: 'EFFICIENCY_DECLINE',
        responseUrgency: 'NORMAL',
      });

    const rankFacilitiesSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'rankFacilitiesByRiskPriority')
      .mockReturnValue({
        rankedFacilities: [
          {
            facilityId: 'FAC-001',
            facilityName: 'Facility 1',
            riskScore: 30,
            riskLevel: 'LOW',
            predictedDelayDays: 0,
            currentProgressRate: 50,
            plannedProgressRate: 50,
            priorityRank: 1,
          },
        ],
      });

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result).toBeDefined();
    expect(result.hasHighRiskFacilities).toBe(false);
    expect(getRecentProgressDataSpy).toHaveBeenCalledWith(['FAC-001'], undefined, undefined);
    expect(getLatestProductivityDataSpy).toHaveBeenCalled();
    expect(classifyDelayReasonSpy).toHaveBeenCalled();

    getRecentProgressDataSpy.mockRestore();
    getLatestProductivityDataSpy.mockRestore();
    calculateDelayRiskScoreSpy.mockRestore();
    classifyDelayReasonSpy.mockRestore();
    rankFacilitiesSpy.mockRestore();
  });

  it('monitorAndJudgeDelayRisk内で負の完了率データが渡された場合、classifyDelayReasonが例外を発生させ、呼び出し元に伝播する', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-123',
    };

    // 負の完了率データを返すスタブ
    const getRecentProgressDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getRecentProgressDataByWorkInstruction')
      .mockResolvedValue([
        {
          workInstructionId: 'WI-001',
          facilityId: 'FAC-001',
          teamId: 'TEAM-001',
          currentProgressRate: -5,
          plannedProgressRate: 50,
          remainingWorkDays: 5,
        },
      ]);

    const getLatestProductivityDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getLatestProductivityDataByWorker')
      .mockResolvedValue([
        {
          workerId: 'WORKER-001',
          productivityRate: 85,
          qualityScore: 90,
          allocatedStaffCount: 5,
          requiredStaffCount: 5,
        },
      ]);

    // classifyDelayReasonが負の値で呼ばれた場合、例外を発生させる
    const classifyDelayReasonSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'classifyDelayReason')
      .mockImplementation((input: ClassifyDelayReasonInput) => {
        if (input.actualProgressRate < 0 || input.actualProgressRate > 100) {
          throw new Error('進捗データが不正です。完了率は0～100の範囲で入力してください');
        }
        return {
          facilityId: input.facilityId,
          teamId: input.teamId,
          insufficientStaffContribution: 30,
          efficiencyDeclineContribution: 50,
          priorityMisalignmentContribution: 20,
          primaryDelayReason: 'EFFICIENCY_DECLINE',
          responseUrgency: 'URGENT',
        };
      });

    // 例外が伝播することを検証
    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗データが不正です。完了率は0～100の範囲で入力してください'
    );

    // classifyDelayReasonが負の値で呼ばれたことを確認
    expect(classifyDelayReasonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actualProgressRate: -5,
      })
    );

    getRecentProgressDataSpy.mockRestore();
    getLatestProductivityDataSpy.mockRestore();
    classifyDelayReasonSpy.mockRestore();
  });

  it('monitorAndJudgeDelayRisk内で完了率100を超えるデータが渡された場合、classifyDelayReasonが例外を発生させる', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['FAC-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER-456',
    };

    const getRecentProgressDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getRecentProgressDataByWorkInstruction')
      .mockResolvedValue([
        {
          workInstructionId: 'WI-002',
          facilityId: 'FAC-002',
          teamId: 'TEAM-002',
          currentProgressRate: 105,
          plannedProgressRate: 80,
          remainingWorkDays: 3,
        },
      ]);

    const getLatestProductivityDataSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'getLatestProductivityDataByWorker')
      .mockResolvedValue([
        {
          workerId: 'WORKER-002',
          productivityRate: 95,
          qualityScore: 88,
          allocatedStaffCount: 6,
          requiredStaffCount: 5,
        },
      ]);

    const classifyDelayReasonSpy = jest
      .spyOn(require('../../src/logic/progress-monitoring-risk-engine'), 'classifyDelayReason')
      .mockImplementation((input: ClassifyDelayReasonInput) => {
        if (input.actualProgressRate < 0 || input.actualProgressRate > 100) {
          throw new Error('進捗データが不正です。完了率は0～100の範囲で入力してください');
        }
        return {
          facilityId: input.facilityId,
          teamId: input.teamId,
          insufficientStaffContribution: 10,
          efficiencyDeclineContribution: 30,
          priorityMisalignmentContribution: 60,
          primaryDelayReason: 'PRIORITY_MISALIGNMENT',
          responseUrgency: 'NORMAL',
        };
      });

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      '進捗データが不正です。完了率は0～100の範囲で入力してください'
    );

    expect(classifyDelayReasonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actualProgressRate: 105,
      })
    );

    getRecentProgressDataSpy.mockRestore();
    getLatestProductivityDataSpy.mockRestore();
    classifyDelayReasonSpy.mockRestore();
  });
});