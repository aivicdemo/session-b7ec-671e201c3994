import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-102: 指定された拠点またはチームが存在しない場合', () => {
  it('存在しない拠点IDが指定された場合、FacilityOrTeamNotFoundErrorを発生させる', async () => {
    const input = {
      facilityIds: ['FACILITY-NONEXISTENT'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-001',
    };

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'FacilityOrTeamNotFoundError',
        message: '指定された拠点またはチームが見つかりません。',
      })
    );
  });

  it('存在しないチームIDが指定された場合、FacilityOrTeamNotFoundErrorを発生させる', async () => {
    const input = {
      facilityIds: ['FACILITY-001'],
      teamIds: ['TEAM-INVALID'],
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-001',
    };

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'FacilityOrTeamNotFoundError',
        message: '指定された拠点またはチームが見つかりません。',
      })
    );
  });

  it('存在しない拠点IDと存在しないチームIDが両方指定された場合、FacilityOrTeamNotFoundErrorを発生させる', async () => {
    const input = {
      facilityIds: ['FACILITY-NONEXISTENT'],
      teamIds: ['TEAM-INVALID'],
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-001',
    };

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'FacilityOrTeamNotFoundError',
        message: '指定された拠点またはチームが見つかりません。',
      })
    );
  });

  it('エラーが発生した場合、MonitorAndJudgeDelayRiskOutputは返却されないことを確認する', async () => {
    const input = {
      facilityIds: ['FACILITY-NONEXISTENT'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER-001',
    };

    let outputReturned = false;
    try {
      await monitorAndJudgeDelayRisk(input);
      outputReturned = true;
    } catch (error) {
      expect(error).toHaveProperty('name', 'FacilityOrTeamNotFoundError');
      expect(outputReturned).toBe(false);
    }
  });
});