import { saveWorker, PersistenceError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

// 型定義
interface SaveWorkerInput {
  workerId: string | null | undefined;
  workerName: string;
  facilityId: string;
  teamId: string;
  jobType: string;
  operatingStatus: string;
  hourlyRate?: number;
  maxWorkingHours?: number;
  createdBy: string;
  updatedBy?: string | null;
}

interface GetFacilityByIdOutput {
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  address: string;
  maxCapacity: number;
  currentCapacity: number;
  operatingStatus: string;
  responsiblePersonName: string;
  contactInfo: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}

interface GetTeamByIdOutput {
  teamId: string;
  teamName: string;
  facilityId: string;
  teamLeaderId: string;
  teamDescription?: string;
  operatingStatus: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}

describe('SCEN-585: saveWorker - トランザクション処理が失敗したとき PersistenceError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PersistenceError when database transaction fails', async () => {
    const inputData: SaveWorkerInput = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    const mockFacility: GetFacilityByIdOutput = {
      facilityId: 'FAC001',
      facilityName: '東京拠点',
      facilityCode: 'TK001',
      address: '東京都渋谷区',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '03-xxxx-xxxx',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
    };

    const mockTeam: GetTeamByIdOutput = {
      teamId: 'TEAM001',
      teamName: 'ピッキングチームA',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: 'ピッキング作業専門',
      operatingStatus: 'active',
      capacity: 20,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
      updatedBy: null,
    };

    // validateInputFormat スタブを設定して true を返すよう構成する
    const validateInputFormatSpy = jest
      .spyOn(dataPersistence, 'validateInputFormat' as any)
      .mockReturnValue(true);

    // getFacilityById スタブを設定して facilityId='FAC001' に対して存在する拠点オブジェクトを返すよう構成する
    jest
      .spyOn(dataPersistence, 'getFacilityById' as any)
      .mockResolvedValue(mockFacility);

    // getTeamById スタブを設定して teamId='TEAM001' に対して存在するチームオブジェクトを返すよう構成する
    jest
      .spyOn(dataPersistence, 'getTeamById' as any)
      .mockResolvedValue(mockTeam);

    // データベースのトランザクション処理がシミュレートされ、接続障害またはコミット失敗により PersistenceError が throw される状態をスタブで再現する
    // 実装内のトランザクション処理でエラーが発生するようにモック化
    jest
      .spyOn(dataPersistence, 'executeTransaction' as any)
      .mockRejectedValueOnce(
        new PersistenceError('作業者データの保存に失敗しました。')
      );

    // saveWorker 関数を実行し、PersistenceError がスローされることを確認
    let caughtError: unknown = null;
    let result: unknown = undefined;

    try {
      result = await saveWorker(inputData);
    } catch (error) {
      caughtError = error;
    }

    // 期待結果の検証
    // PersistenceError 例外が throw される
    expect(caughtError).toBeInstanceOf(PersistenceError);

    // 例外のメッセージは「作業者データの保存に失敗しました。」である
    if (caughtError instanceof PersistenceError) {
      expect(caughtError.message).toBe('作業者データの保存に失敗しました。');
    }

    // 出力型 SaveWorkerOutput は返されない
    expect(result).toBeUndefined();
    expect(caughtError).not.toBeNull();

    // クリーンアップ
    validateInputFormatSpy.mockRestore();
  });
});