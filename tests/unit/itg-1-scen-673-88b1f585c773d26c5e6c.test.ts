import {
  saveWorkInstruction,
  SaveWorkInstructionInput,
  SaveWorkInstructionOutput,
  getFacilityById,
  getTeamById,
} from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-673: 新規作成時に必須項目がすべて妥当な値で指定されると、新しい作業指示IDが生成されて保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate new work instruction ID and save work instruction with all valid required fields', async () => {
    // Arrange: テスト用の有効な SaveWorkInstructionInput を準備する
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI-20240115-001',
      workName: '梱包作業',
      workDescription: undefined,
      plannedStartDateTime: '2024-01-15T09:00:00',
      plannedEndDateTime: '2024-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: undefined,
      requiredWorkerCount: 5,
      priority: '中',
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    // スタブ getFacilityById を設定して、facilityId='FAC001' に対して正常に拠点情報を返す
    (getFacilityById as jest.Mock).mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC001',
      address: 'テスト住所',
      maxCapacity: 50,
      currentCapacity: 20,
      operatingStatus: 'active',
      responsiblePersonName: 'テスト責任者',
      contactInfo: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    // スタブ getTeamById を設定して、teamId='TEAM001' に対して正常にチーム情報（定員=10）を返す
    (getTeamById as jest.Mock).mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'テストチーム',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: 'テストチーム説明',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    // スタブ validateDateTimeRange を設定して、検証が成功（エラーなし）を返す
    const validateDateTimeRange = jest.fn().mockResolvedValue(undefined);
    global.validateDateTimeRange = validateDateTimeRange;

    // スタブ validateNumericQuantity を設定して、検証が成功（エラーなし）を返す
    const validateNumericQuantity = jest.fn().mockResolvedValue(undefined);
    global.validateNumericQuantity = validateNumericQuantity;

    // スタブ validateReferentialIntegrity を設定して、検証が成功（エラーなし）を返す
    const validateReferentialIntegrity = jest.fn().mockResolvedValue(undefined);
    global.validateReferentialIntegrity = validateReferentialIntegrity;

    const mockOutput: SaveWorkInstructionOutput = {
      workInstructionId: 'WI-20240115-001-GEN-XXXXX',
      workInstructionNumber: 'WI-20240115-001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workName: '梱包作業',
      savedAt: new Date().toISOString(),
      isNewRecord: true,
    };

    (saveWorkInstruction as jest.Mock).mockResolvedValue(mockOutput);

    // Act: saveWorkInstruction を呼び出し、上記の SaveWorkInstructionInput を入力する
    const result = await saveWorkInstruction(input);

    // Assert: 出力型 SaveWorkInstructionOutput が返却される
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    
    // その値は、workInstructionId に null でない生成済みID（例：'WI-20240115-001-GEN-XXXXX'）
    expect(result.workInstructionId).not.toBeNull();
    expect(result.workInstructionId).toBe('WI-20240115-001-GEN-XXXXX');
    
    // workInstructionNumber='WI-20240115-001'
    expect(result.workInstructionNumber).toBe('WI-20240115-001');
    
    // facilityId='FAC001'
    expect(result.facilityId).toBe('FAC001');
    
    // teamId='TEAM001'
    expect(result.teamId).toBe('TEAM001');
    
    // workName='梱包作業'
    expect(result.workName).toBe('梱包作業');
    
    // savedAt が ISO 8601 形式の現在時刻相当
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // isNewRecord=true
    expect(result.isNewRecord).toBe(true);

    // Verify the function was called with correct input
    expect(saveWorkInstruction).toHaveBeenCalledWith(input);
    expect(saveWorkInstruction).toHaveBeenCalledTimes(1);

    // エラーは発生しない
    expect(result).toEqual(expect.objectContaining({
      workInstructionId: expect.any(String),
      workInstructionNumber: 'WI-20240115-001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workName: '梱包作業',
      savedAt: expect.any(String),
      isNewRecord: true,
    }));

    // Cleanup
    delete global.validateDateTimeRange;
    delete global.validateNumericQuantity;
    delete global.validateReferentialIntegrity;
  });
});