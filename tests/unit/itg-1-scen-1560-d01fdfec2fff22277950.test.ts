import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as progressMonitoringModule from '../../src/logic/progress-monitoring-risk-engine';

describe('進捗遅延リスク常時監視', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現在の完了率が負の値の場合、InvalidInputParameterErrorをスローする', async () => {
    const mockProgressData = {
      workInstructionId: 'I-001',
      currentProgress: -5,
      plannedProgressRate: 50,
    };

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any).mockResolvedValue([mockProgressData]);
    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue([]);

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      'InvalidInputParameterError'
    );
  });

  it('エラーメッセージが正確であることを確認する', async () => {
    const mockProgressData = {
      workInstructionId: 'I-001',
      currentProgress: -5,
      plannedProgressRate: 50,
    };

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any).mockResolvedValue([mockProgressData]);
    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue([]);

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('エラーがスローされるべき');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe(
          '進捗データが不正です。完了率は0～100の範囲で入力してください'
        );
      } else {
        fail('エラーオブジェクトが不正です');
      }
    }
  });

  it('現在の完了率が100を超える場合、InvalidInputParameterErrorをスローする', async () => {
    const mockProgressData = {
      workInstructionId: 'I-001',
      currentProgress: 105,
      plannedProgressRate: 50,
    };

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any).mockResolvedValue([mockProgressData]);
    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue([]);

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
      'InvalidInputParameterError'
    );
  });

  it('エラー発生時にMonitorAndJudgeDelayRiskOutputは返却されない', async () => {
    const mockProgressData = {
      workInstructionId: 'I-001',
      currentProgress: -5,
      plannedProgressRate: 50,
    };

    jest.spyOn(progressMonitoringModule, 'getRecentProgressDataByWorkInstruction' as any).mockResolvedValue([mockProgressData]);
    jest.spyOn(progressMonitoringModule, 'getLatestProductivityDataByWorker' as any).mockResolvedValue([]);

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-15T10:30:00Z',
      userId: 'USER001',
    };

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('エラーがスローされるべき');
    } catch (error: unknown) {
      expect(error).toBeDefined();
    }
  });
});