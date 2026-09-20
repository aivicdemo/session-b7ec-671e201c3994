import { saveWorkResult, SaveWorkResultInput } from '../../src/logic/data-persistence';

describe('SCEN-707: 必須フィールドが空だとInvalidWorkResultDataエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const setupMocks = () => {
    // getWorkInstructionByIdのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'wi-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      workInstructionNumber: 'WI-2024-001',
      workName: 'テスト作業',
      plannedStartDateTime: '2024-01-01T08:00:00Z',
      plannedEndDateTime: '2024-01-01T17:00:00Z',
      progressStatus: 'in_progress',
      requiredWorkerCount: 5,
      priority: 'high',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-admin',
      updatedBy: 'user-admin',
    });

    // getWorkerByIdのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'getWorkerById').mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'テスト作業者',
      facilityId: 'fac-001',
      teamId: 'team-001',
      jobType: 'assembly',
      operatingStatus: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-admin',
    });

    // getFacilityByIdのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'getFacilityById').mockResolvedValue({
      facilityId: 'fac-001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC-001',
      address: 'テスト住所',
      maxCapacity: 100,
      currentCapacity: 50,
      operatingStatus: 'active',
      responsiblePersonName: 'テスト責任者',
      contactInfo: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-admin',
    });

    // getTeamByIdのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'getTeamById').mockResolvedValue({
      teamId: 'team-001',
      teamName: 'テストチーム',
      facilityId: 'fac-001',
      teamLeaderId: 'leader-001',
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-admin',
    });

    // validateNumericQuantityのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'validateNumericQuantity').mockImplementation((value: number) => {
      if (value >= 0 && Number.isInteger(value)) {
        return true;
      }
      throw new Error(`Invalid quantity: ${value}`);
    });

    // validateDateTimeRangeのスタブ
    jest.spyOn(require('../../src/logic/data-persistence'), 'validateDateTimeRange').mockImplementation(
      (startDateTime: string, endDateTime: string) => {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (start < end) {
          return true;
        }
        throw new Error(`Invalid date range: start=${startDateTime}, end=${endDateTime}`);
      }
    );
  };

  test('workInstructionIdがnullの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: null as any,
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('workerIdがundefinedの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: undefined as any,
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('facilityIdが空文字列の場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: '' as any,
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('teamIdがnullの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: null as any,
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('actualStartDateTimeがnullの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: null as any,
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('actualEndDateTimeが空文字列の場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '' as any,
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('actualQuantityがnullの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: null as any,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('workStatusがundefinedの場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: undefined as any,
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('createdByが空文字列の場合、InvalidWorkResultDataエラーが発生する', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: '' as any,
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（actualQuantityがnull）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: null as any,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（workInstructionIdがnull）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: null as any,
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（actualStartDateTimeがnull）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: null as any,
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了\s*:\s*2024-01-01T09:00:00Z/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（actualEndDateTimeが空文字列）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '' as any,
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始\s*:\s*2024-01-01T08:00:00Z/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（workerIdがundefined）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: undefined as any,
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（facilityIdが空文字列）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: '' as any,
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（teamIdがnull）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: null as any,
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（workStatusがundefined）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: undefined as any,
      createdBy: 'user-001',
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });

  test('エラーメッセージは不正なフィールドの値を含む形式である（createdByが空文字列）', async () => {
    setupMocks();
    const invalidInput: SaveWorkResultInput = {
      workResultId: null,
      workInstructionId: 'wi-001',
      workerId: 'worker-001',
      facilityId: 'fac-001',
      teamId: 'team-001',
      actualStartDateTime: '2024-01-01T08:00:00Z',
      actualEndDateTime: '2024-01-01T09:00:00Z',
      actualQuantity: 10,
      workStatus: 'completed',
      createdBy: '' as any,
    };

    try {
      await saveWorkResult(invalidInput);
      fail('エラーがthrowされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/作業実績データが不正です/);
      expect(error.message).toMatch(/実績数量\s*:\s*10/);
      expect(error.message).toMatch(/開始/);
      expect(error.message).toMatch(/終了/);
    }
  });
});