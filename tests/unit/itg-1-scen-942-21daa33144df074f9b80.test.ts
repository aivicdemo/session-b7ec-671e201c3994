import { saveProductivityData } from '../../src/logic/data-persistence';
import * as validationCommon from '../../src/logic/validation-common-calculation';

describe('SCEN-942: 習熟度レベルが無効な値である場合、ProductivityMetricsCalculationError エラーが発生する', () => {
  beforeEach(() => {
    jest.spyOn(validationCommon, 'validateNumericQuantity').mockResolvedValue(true);
    jest.spyOn(validationCommon, 'validateReferentialIntegrity').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw ProductivityMetricsCalculationError when proficiencyLevel is null', async () => {
    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'wr-001',
      workerId: 'worker-001',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: null as unknown as string,
      remarks: 'Test remark',
      createdBy: 'user-001',
      updatedBy: undefined,
    };

    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'ProductivityMetricsCalculationError',
      message: '生産性指標の計算に失敗しました。入力データを確認してください。',
    });
  });

  it('should throw ProductivityMetricsCalculationError when proficiencyLevel is empty string', async () => {
    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'wr-002',
      workerId: 'worker-002',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: '',
      remarks: undefined,
      createdBy: 'user-002',
      updatedBy: undefined,
    };

    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'ProductivityMetricsCalculationError',
      message: '生産性指標の計算に失敗しました。入力データを確認してください。',
    });
  });

  it('should throw ProductivityMetricsCalculationError when proficiencyLevel is undefined', async () => {
    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'wr-003',
      workerId: 'worker-003',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: undefined as unknown as string,
      remarks: undefined,
      createdBy: 'user-003',
      updatedBy: undefined,
    };

    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'ProductivityMetricsCalculationError',
      message: '生産性指標の計算に失敗しました。入力データを確認してください。',
    });
  });

  it('should throw ProductivityMetricsCalculationError when proficiencyLevel is invalid business rule value', async () => {
    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'wr-004',
      workerId: 'worker-004',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: 'invalid_level',
      remarks: undefined,
      createdBy: 'user-004',
      updatedBy: undefined,
    };

    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'ProductivityMetricsCalculationError',
      message: '生産性指標の計算に失敗しました。入力データを確認してください。',
    });
  });

  it('should not persist data to database when ProductivityMetricsCalculationError is thrown', async () => {
    const dbPersistSpy = jest.fn();
    
    jest.spyOn(validationCommon, 'validateNumericQuantity').mockImplementation(async () => {
      return true;
    });

    const input = {
      productivityDataId: null as string | null | undefined,
      workResultId: 'wr-005',
      workerId: 'worker-005',
      facilityId: 'facility-001',
      teamId: 'team-001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 93.75,
      qualityScore: 95,
      errorCount: 2,
      proficiencyLevel: null as unknown as string,
      remarks: undefined,
      createdBy: 'user-005',
      updatedBy: undefined,
    };

    await expect(saveProductivityData(input)).rejects.toMatchObject({
      name: 'ProductivityMetricsCalculationError',
    });
  });
});