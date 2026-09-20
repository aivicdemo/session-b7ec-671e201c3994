import { saveWorker, getFacilityById, getTeamById, getWorkerById } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual('../../src/logic/data-persistence'),
  getFacilityById: jest.fn(),
  getTeamById: jest.fn(),
  getWorkerById: jest.fn(),
}));

describe('SCEN-586: 新規作成時に createdBy が指定されると保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist createdBy field when saving a new worker record', async () => {
    // getFacilityByIdをスタブ化し、facilityId='FAC001'に対して拠点情報を返す
    (dataPersistence.getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '000-0000-0000',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // getTeamByIdをスタブ化し、teamId='TEAM001'かつfacilityId='FAC001'に対してチーム情報を返す
    (dataPersistence.getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'テストチーム',
      facilityId: 'FAC001',
      teamLeaderId: 'leader001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedBy: null,
    });

    // テストデータの準備
    const input = {
      workerId: null,
      workerName: '田中太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdBy: 'user123',
      updatedBy: undefined,
    };

    // saveWorkerを呼び出す
    const result = await saveWorker(input);

    // 戻り値のSaveWorkerOutputを検証する
    expect(result).toBeDefined();
    expect(result.isNewRecord).toBe(true);
    expect(result.workerId).toBeDefined();
    expect(result.workerId).not.toBeNull();
    expect(result.workerName).toBe('田中太郎');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.savedAt).toBeDefined();
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/);

    // データベースに問い合わせ、保存されたレコードのcreatedByが'user123'であることを確認
    (dataPersistence.getWorkerById as jest.Mock).mockResolvedValueOnce({
      workerId: result.workerId,
      workerName: '田中太郎',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      jobType: 'ピッキング',
      operatingStatus: '稼働中',
      hourlyRate: 1500,
      maxWorkingHours: 8,
      createdAt: result.savedAt,
      updatedAt: result.savedAt,
      createdBy: 'user123',
      updatedBy: undefined,
    });

    const savedRecord = await getWorkerById({ workerId: result.workerId });
    expect(savedRecord.createdBy).toBe('user123');

    // getFacilityByIdが呼び出されたことを確認
    expect(dataPersistence.getFacilityById).toHaveBeenCalledWith(
      expect.objectContaining({ facilityId: 'FAC001' })
    );

    // getTeamByIdが呼び出されたことを確認
    expect(dataPersistence.getTeamById).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 'TEAM001' })
    );
  });
});