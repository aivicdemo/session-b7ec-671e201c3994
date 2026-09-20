import { saveWorker, PersistenceError } from '../../src/logic/data-persistence';
import { SaveWorkerInput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-584: データベース接続障害時の PersistenceError 発生', () => {
  let validateInputFormatSpy: jest.SpyInstance;
  let getFacilityByIdSpy: jest.SpyInstance;
  let getTeamByIdSpy: jest.SpyInstance;
  let persistSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('データベース接続障害が発生したとき PersistenceError が発生する', async () => {
    // validateInputFormat スタブを設定
    validateInputFormatSpy = jest.spyOn(dataPersistence as any, 'validateInputFormat');
    validateInputFormatSpy.mockReturnValue(true);

    // getFacilityById スタブを設定
    getFacilityByIdSpy = jest.spyOn(dataPersistence as any, 'getFacilityById');
    getFacilityByIdSpy.mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '00-0000-0000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'ADMIN-001',
      updatedBy: null,
    });

    // getTeamById スタブを設定
    getTeamByIdSpy = jest.spyOn(dataPersistence as any, 'getTeamById');
    getTeamByIdSpy.mockResolvedValue({
      teamId: 'TEAM-001',
      teamName: 'テストチーム',
      facilityId: 'FAC-001',
      teamLeaderId: 'LEAD-001',
      teamDescription: 'テスト説明',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'ADMIN-001',
      updatedBy: null,
    });

    // データベーストランザクション処理が接続エラーを発生させるようにモック化
    // saveWorker が内部で使用するデータベース永続化処理をモック
    persistSpy = jest.spyOn(dataPersistence as any, 'persistWorkerRecord');
    persistSpy.mockRejectedValue(
      new PersistenceError('作業者データの保存に失敗しました。')
    );

    const input: SaveWorkerInput = {
      workerId: null,
      workerName: '山田太郎',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'ADMIN-001',
      updatedBy: undefined,
    };

    // saveWorker を呼び出し、PersistenceError が発生することを確認
    let caughtError: any;
    try {
      await saveWorker(input);
      fail('PersistenceError が発生するはずです');
    } catch (error: any) {
      caughtError = error;
    }

    // エラーが PersistenceError であることを確認
    expect(caughtError).toBeInstanceOf(PersistenceError);
    expect(caughtError.name).toBe('PersistenceError');
    expect(caughtError.message).toBe('作業者データの保存に失敗しました。');

    // validateInputFormat が呼び出されたことを確認
    expect(validateInputFormatSpy).toHaveBeenCalled();

    // getFacilityById が呼び出されたことを確認
    expect(getFacilityByIdSpy).toHaveBeenCalledWith('FAC-001');

    // getTeamById が呼び出されたことを確認
    expect(getTeamByIdSpy).toHaveBeenCalledWith('TEAM-001');

    // データベース永続化処理が呼び出されたことを確認（但し、失敗している）
    expect(persistSpy).toHaveBeenCalled();

    // 新規レコードがデータベースに保存されていないことを確認
    // persistSpy が呼び出されているが、エラーで中断されているため、
    // 呼び出し後に SaveWorkerOutput が返されていないことを確認
    expect(caughtError).not.toBeNull();
  });
});