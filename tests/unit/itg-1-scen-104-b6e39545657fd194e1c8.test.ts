import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
    Object.setPrototypeOf(this, DataIntegrityError.prototype);
  }
}

class FacilityOrTeamNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FacilityOrTeamNotFoundError';
    Object.setPrototypeOf(this, FacilityOrTeamNotFoundError.prototype);
  }
}

// 外部依存をモック化
jest.mock('../../src/logic/data-access', () => ({
  getRecentProgressDataByWorkInstruction: jest.fn(),
  getLatestProductivityDataByWorker: jest.fn(),
  validateReferentialIntegrity: jest.fn(),
}));

describe('SCEN-104: 進捗データと生産性データ間の参照整合性破損時のエラー処理', () => {
  let mockGetRecentProgressData: jest.Mock;
  let mockGetLatestProductivityData: jest.Mock;
  let mockValidateReferentialIntegrity: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const dataAccess = require('../../src/logic/data-access');
    mockGetRecentProgressData = dataAccess.getRecentProgressDataByWorkInstruction;
    mockGetLatestProductivityData = dataAccess.getLatestProductivityDataByWorker;
    mockValidateReferentialIntegrity = dataAccess.validateReferentialIntegrity;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('進捗データと生産性データ間の参照整合性が破損している場合、DataIntegrityErrorを発生させる', async () => {
    // セットアップ: 進捗データを設定
    mockGetRecentProgressData.mockResolvedValue([
      {
        workInstructionId: 'work-instr-001',
        facilityId: 'facility-001',
        teamId: 'TEAM-001',
        plannedProgressRate: 50,
        actualProgressRate: 40,
        workerIds: ['worker-100', 'worker-101'],
      },
      {
        workInstructionId: 'work-instr-002',
        facilityId: 'facility-002',
        teamId: 'TEAM-001',
        plannedProgressRate: 60,
        actualProgressRate: 45,
        workerIds: ['worker-100', 'worker-101'],
      },
    ]);

    // 参照整合性破損: 進捗データの作業者IDと異なる作業者IDを持つデータを返す
    mockGetLatestProductivityData.mockResolvedValue([
      {
        workerId: 'worker-200',
        facilityId: 'facility-001',
        productivityRate: 80,
        qualityScore: 85,
        remainingWorkDays: 5,
      },
      {
        workerId: 'worker-201',
        facilityId: 'facility-002',
        productivityRate: 75,
        qualityScore: 80,
        remainingWorkDays: 5,
      },
    ]);

    // 参照整合性チェックで整合性破損を検出したことを示す結果を返す
    mockValidateReferentialIntegrity.mockResolvedValue({
      isIntegral: false,
      hasIntegrityError: true,
      errorDetail: '作業者ID worker-100, worker-101 が生産性データに存在しません',
    });

    // MonitorAndJudgeDelayRiskInput オブジェクトを構成
    const facilityIds = ['facility-001', 'facility-002'];
    const teamIds = ['TEAM-001'];
    const evaluationDateTime = new Date().toISOString();
    const userId = 'user-123';

    const input = {
      facilityIds,
      teamIds,
      evaluationDateTime,
      userId,
    };

    // monitorAndJudgeDelayRisk 処理を呼び出し、DataIntegrityError が発生することを確認
    let errorThrown: DataIntegrityError | null = null;
    let outputReturned: any = null;

    try {
      outputReturned = await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      errorThrown = error as DataIntegrityError;
    }

    // 検証1: DataIntegrityError が発生していること
    expect(errorThrown).not.toBeNull();
    expect(errorThrown).toBeInstanceOf(Error);
    expect(errorThrown?.name).toBe('DataIntegrityError');

    // 検証2: エラー文言が正しいこと
    expect(errorThrown?.message).toBe('データ整合性エラーが発生しました。システム管理者に報告してください。');

    // 検証3: MonitorAndJudgeDelayRiskOutput が返却されていないこと
    expect(outputReturned).toBeUndefined();

    // 検証4: FacilityOrTeamNotFoundError ではなく DataIntegrityError が主因であることを確認
    expect(errorThrown?.name).not.toBe('FacilityOrTeamNotFoundError');

    // 検証5: 実装の関数が実際に呼び出されたことを確認
    expect(mockGetRecentProgressData).toHaveBeenCalled();
    expect(mockGetLatestProductivityData).toHaveBeenCalled();
    expect(mockValidateReferentialIntegrity).toHaveBeenCalled();
  });
});