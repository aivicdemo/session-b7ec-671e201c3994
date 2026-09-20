import { saveProgressData, SaveProgressDataInput, SaveProgressDataOutput } from '../../src/logic/data-persistence';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

describe('SCEN-883: 既存進捗データを更新する場合、指定されたIDのレコードを更新して保存し、isNewRecordがfalseで返される', () => {
  let validateNumericQuantityMock: jest.Mock;
  let validateDateTimeRangeMock: jest.Mock;
  let validateReferentialIntegrityMock: jest.Mock;

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => ((({
      toISOString: () => '2024-01-15T10:30:45.123Z',
    }) as any)));

    validateNumericQuantityMock = jest.fn().mockResolvedValue(true);
    validateDateTimeRangeMock = jest.fn().mockResolvedValue(true);
    validateReferentialIntegrityMock = jest.fn().mockResolvedValue(true);

    jest.spyOn(dataPersistenceModule, 'validateNumericQuantity' as any).mockImplementation(validateNumericQuantityMock);
    jest.spyOn(dataPersistenceModule, 'validateDateTimeRange' as any).mockImplementation(validateDateTimeRangeMock);
    jest.spyOn(dataPersistenceModule, 'validateReferentialIntegrity' as any).mockImplementation(validateReferentialIntegrityMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('既存の進捗データレコードを指定IDで更新し、isNewRecordがfalseで返される', async () => {
    const existingProgressDataId = 'PROG-DATA-001';
    const updateInput: SaveProgressDataInput = {
      progressDataId: existingProgressDataId,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      progressDate: '2024-01-15',
      plannedQuantity: 1000,
      actualQuantity: 750,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: '進捗更新',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(validateNumericQuantityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actualQuantity: 750,
        plannedQuantity: 1000,
      })
    );
    expect(validateDateTimeRangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        progressDate: '2024-01-15',
        workInstructionId: 'WI-001',
      })
    );
    expect(validateReferentialIntegrityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
      })
    );

    expect(result.isNewRecord).toBe(false);
    expect(result.progressDataId).toBe(existingProgressDataId);
    expect(result.workInstructionId).toBe('WI-001');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.teamId).toBe('TEAM-001');
    expect(result.progressDate).toBe('2024-01-15');
    expect(result.actualQuantity).toBe(750);
    expect(result.completionRate).toBe(75);
    expect(result.delayFlag).toBe(false);
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });

  it('completionRateは自動計算され、actualQuantity/plannedQuantityの百分率として返される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-002',
      workInstructionId: 'WI-002',
      facilityId: 'FAC-002',
      teamId: 'TEAM-002',
      progressDate: '2024-01-16',
      plannedQuantity: 500,
      actualQuantity: 350,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(result.completionRate).toBe(70);
    expect(result.isNewRecord).toBe(false);
  });

  it('delayFlagが省略された場合、デフォルト値falseが返される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-003',
      workInstructionId: 'WI-003',
      facilityId: 'FAC-003',
      teamId: 'TEAM-003',
      progressDate: '2024-01-17',
      plannedQuantity: 200,
      actualQuantity: 200,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(result.delayFlag).toBe(false);
    expect(result.isNewRecord).toBe(false);
  });

  it('savedAtはISO 8601形式の有効なタイムスタンプで返される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-004',
      workInstructionId: 'WI-004',
      facilityId: 'FAC-004',
      teamId: 'TEAM-004',
      progressDate: '2024-01-18',
      plannedQuantity: 1200,
      actualQuantity: 900,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: '更新テスト',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.savedAt).toMatch(iso8601Regex);
    expect(result.isNewRecord).toBe(false);
  });

  it('既存レコード更新時にprogressDataIdは呼び出し時の指定値と同じまま返される', async () => {
    const specifiedProgressDataId = 'PROG-DATA-CUSTOM-005';
    const updateInput: SaveProgressDataInput = {
      progressDataId: specifiedProgressDataId,
      workInstructionId: 'WI-005',
      facilityId: 'FAC-005',
      teamId: 'TEAM-005',
      progressDate: '2024-01-19',
      plannedQuantity: 800,
      actualQuantity: 600,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(result.progressDataId).toBe(specifiedProgressDataId);
    expect(result.isNewRecord).toBe(false);
  });

  it('actualQuantityがplannedQuantityの範囲内である場合、正常に更新される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-006',
      workInstructionId: 'WI-006',
      facilityId: 'FAC-006',
      teamId: 'TEAM-006',
      progressDate: '2024-01-20',
      plannedQuantity: 1000,
      actualQuantity: 750,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-003',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(validateNumericQuantityMock).toHaveBeenCalled();
    expect(result.isNewRecord).toBe(false);
    expect(result.actualQuantity).toBe(750);
    expect(result.completionRate).toBe(75);
  });

  it('progressDateが作業指示の予定開始日～終了日内である場合、正常に更新される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-007',
      workInstructionId: 'WI-007',
      facilityId: 'FAC-007',
      teamId: 'TEAM-007',
      progressDate: '2024-01-15',
      plannedQuantity: 500,
      actualQuantity: 400,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-004',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(validateDateTimeRangeMock).toHaveBeenCalled();
    expect(result.isNewRecord).toBe(false);
    expect(result.progressDate).toBe('2024-01-15');
  });

  it('workInstructionId・facilityId・teamIdが全て存在する場合、正常に更新される', async () => {
    const updateInput: SaveProgressDataInput = {
      progressDataId: 'PROG-DATA-008',
      workInstructionId: 'WI-008',
      facilityId: 'FAC-008',
      teamId: 'TEAM-008',
      progressDate: '2024-01-16',
      plannedQuantity: 600,
      actualQuantity: 480,
      completionRate: undefined,
      delayFlag: undefined,
      delayDays: undefined,
      remarks: undefined,
      createdBy: 'user-001',
      updatedBy: 'user-005',
    };

    validateNumericQuantityMock.mockResolvedValue(true);
    validateDateTimeRangeMock.mockResolvedValue(true);
    validateReferentialIntegrityMock.mockResolvedValue(true);

    const result: SaveProgressDataOutput = await saveProgressData(updateInput);

    expect(validateReferentialIntegrityMock).toHaveBeenCalled();
    expect(result.isNewRecord).toBe(false);
    expect(result.workInstructionId).toBe('WI-008');
    expect(result.facilityId).toBe('FAC-008');
    expect(result.teamId).toBe('TEAM-008');
  });
});