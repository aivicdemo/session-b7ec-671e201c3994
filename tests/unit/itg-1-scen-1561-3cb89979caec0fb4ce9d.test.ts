import { monitorAndJudgeDelayRisk, classifyDelayReason } from '../../src/logic/progress-monitoring-risk-engine';
import { MonitorAndJudgeDelayRiskInput, ClassifyDelayReasonInput } from '../../src/logic/progress-monitoring-risk-engine';
import { WmsHandyTerminalDataSource } from '../../src/adapters/wms-handy-terminal-data-source';

jest.mock('../../src/adapters/wms-handy-terminal-data-source');

describe('SCEN-1561: 必要人数が0以下の場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('WMS連携で requiredWorkerCount=0 のデータが返却される場合、InvalidInputParameterErrorがスローされること', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-20T10:30:00Z',
      userId: 'U001',
    };

    const mockProgressData = {
      facilityId: 'F001',
      facilityName: 'テスト拠点1',
      teamId: 'T001',
      currentProgressRate: 50,
      plannedProgressRate: 70,
      allocatedStaffCount: 5,
      requiredWorkerCount: 0,
      averageProductivityRate: 85,
      workInstructionPriorityDistribution: { high: 2, medium: 3, low: 1 },
    };

    (WmsHandyTerminalDataSource.fetchProgressData as jest.Mock).mockResolvedValue([
      mockProgressData,
    ]);

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }
  });

  test('classifyDelayReason が requiredStaffCount=0 で呼び出される際、正確なエラーメッセージがスローされること', () => {
    const classifyInput: ClassifyDelayReasonInput = {
      facilityId: 'F001',
      teamId: 'T001',
      plannedProgressRate: 75,
      actualProgressRate: 45,
      averageProductivityRate: 80,
      allocatedStaffCount: 3,
      requiredStaffCount: 0,
      workInstructionPriorityDistribution: { high: 1, medium: 2, low: 1 },
    };

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      classifyDelayReason(classifyInput);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }
  });

  test('複数拠点から取得したデータ内で requiredWorkerCount=0 が含まれる場合、monitorAndJudgeDelayRisk がエラーをスローすること', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-20T10:30:00Z',
      userId: 'U001',
    };

    const mockProgressDataWithZeroRequired = {
      facilityId: 'F001',
      facilityName: 'テスト拠点1',
      teamId: 'T001',
      currentProgressRate: 55,
      plannedProgressRate: 80,
      allocatedStaffCount: 4,
      requiredWorkerCount: 0,
      averageProductivityRate: 82,
      workInstructionPriorityDistribution: { high: 3, medium: 2, low: 0 },
    };

    (WmsHandyTerminalDataSource.fetchProgressData as jest.Mock).mockResolvedValue([
      mockProgressDataWithZeroRequired,
    ]);

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }
  });

  test('monitorAndJudgeDelayRisk が処理実行時に requiredWorkerCount=0 を含むデータを受け取り、業務ルール br-tx_4-004 に基づいてエラーがスローされること', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-20T10:30:00Z',
      userId: 'U001',
    };

    const mockProgressData = {
      facilityId: 'F001',
      facilityName: 'テスト拠点1',
      teamId: 'T001',
      currentProgressRate: 50,
      plannedProgressRate: 70,
      allocatedStaffCount: 5,
      requiredWorkerCount: 0,
      averageProductivityRate: 85,
      workInstructionPriorityDistribution: { high: 2, medium: 3, low: 1 },
    };

    (WmsHandyTerminalDataSource.fetchProgressData as jest.Mock).mockResolvedValue([
      mockProgressData,
    ]);

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }

    expect(WmsHandyTerminalDataSource.fetchProgressData).toHaveBeenCalledWith(['F001']);
  });

  test('requiredWorkerCount が負の値の場合、同じエラーメッセージがスローされること', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['F001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2025-01-20T10:30:00Z',
      userId: 'U001',
    };

    const mockProgressData = {
      facilityId: 'F001',
      facilityName: 'テスト拠点1',
      teamId: 'T001',
      currentProgressRate: 50,
      plannedProgressRate: 70,
      allocatedStaffCount: 5,
      requiredWorkerCount: -1,
      averageProductivityRate: 85,
      workInstructionPriorityDistribution: { high: 2, medium: 3, low: 1 },
    };

    (WmsHandyTerminalDataSource.fetchProgressData as jest.Mock).mockResolvedValue([
      mockProgressData,
    ]);

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }
  });

  test('classifyDelayReason が直接 requiredStaffCount=-1 で呼び出される場合、エラーメッセージがスローされること', () => {
    const classifyInput: ClassifyDelayReasonInput = {
      facilityId: 'F001',
      teamId: 'T001',
      plannedProgressRate: 70,
      actualProgressRate: 50,
      averageProductivityRate: 85,
      allocatedStaffCount: 5,
      requiredStaffCount: -1,
      workInstructionPriorityDistribution: { high: 2, medium: 3, low: 1 },
    };

    const expectedErrorMessage = '必要人数が不正です。1人以上の値を入力してください';

    try {
      classifyDelayReason(classifyInput);
      fail('例外がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('InvalidInputParameterError');
      expect(error.message).toBe(expectedErrorMessage);
    }
  });
});