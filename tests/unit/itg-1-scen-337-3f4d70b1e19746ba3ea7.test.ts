import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation';
import * as productivityCalculationModule from '../../src/logic/productivity-calculation';
import * as workerManagementModule from '../../src/logic/worker-management';
import * as workInstructionManagementModule from '../../src/logic/work-instruction-management';
import * as persistenceModule from '../../src/logic/persistence';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/validation');
jest.mock('../../src/logic/productivity-calculation');
jest.mock('../../src/logic/worker-management');
jest.mock('../../src/logic/work-instruction-management');
jest.mock('../../src/logic/persistence');

describe('SCEN-337: 作業者の習熟度データが取得できない場合、習熟度データ欠落エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistenceModule.getProficiencyById as jest.Mock).mockReturnValue(null);
    (validationModule.validateDateTimeRange as jest.Mock).mockReturnValue(true);
    (validationModule.validateNumericQuantity as jest.Mock).mockReturnValue(true);
    (validationModule.validateReferentialIntegrity as jest.Mock).mockReturnValue(true);
    (productivityCalculationModule.calculateProductivityRate as jest.Mock).mockReturnValue(85);
    (productivityCalculationModule.calculateWorkHours as jest.Mock).mockReturnValue(8);
    (productivityCalculationModule.judgeProficiencyLevel as jest.Mock).mockReturnValue('intermediate');
    (workerManagementModule.getWorkerById as jest.Mock).mockReturnValue({
      workerId: 'W001',
      workerName: 'Test Worker',
    });
    (workInstructionManagementModule.getWorkInstructionById as jest.Mock).mockReturnValue({
      workInstructionId: 'WI001',
      workName: 'Test Work',
    });
    (persistenceModule.saveProductivityData as jest.Mock).mockReturnValue({
      savedProductivityRecords: 1,
      savedProgressRecords: 0,
      persistenceStatus: 'success',
    });
    (persistenceModule.recordOperationAudit as jest.Mock).mockReturnValue({
      auditId: 'AU001',
    });
  });

  it('習熟度データが取得できない場合、ProficiencyDataMissingErrorをスローする', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'WI001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          workStartDateTime: '2024-01-15T08:00:00Z',
          workEndDateTime: '2024-01-15T16:00:00Z',
          completedQuantity: 100,
          defectQuantity: 2,
          errorCount: 0,
          remarks: 'Test work',
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'USR001',
    };

    await expect(
      aggregateWorkResultsAndCalculateProductivity(input)
    ).rejects.toThrow();

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
      fail('ProficiencyDataMissingError がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('ProficiencyDataMissingError');
      expect(error.message).toContain('作業者ID W001 の習熟度データが見つかりません。');
    }
  });

  it('getProficiencyByIdがnullを返す場合、処理は中断される', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'WI001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          workStartDateTime: '2024-01-15T08:00:00Z',
          workEndDateTime: '2024-01-15T16:00:00Z',
          completedQuantity: 100,
          defectQuantity: 2,
          errorCount: 0,
          remarks: 'Test work',
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'USR001',
    };

    (dataPersistenceModule.getProficiencyById as jest.Mock).mockReturnValue(null);

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
      fail('ProficiencyDataMissingError がスローされるべき');
    } catch (error: any) {
      expect(error.constructor.name).toBe('ProficiencyDataMissingError');
      expect((persistenceModule.saveProductivityData as jest.Mock)).not.toHaveBeenCalled();
    }
  });

  it('例外のメッセージが正確に格納される', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'WI001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          workStartDateTime: '2024-01-15T08:00:00Z',
          workEndDateTime: '2024-01-15T16:00:00Z',
          completedQuantity: 100,
          defectQuantity: 2,
          errorCount: 0,
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'USR001',
    };

    (dataPersistenceModule.getProficiencyById as jest.Mock).mockReturnValue(undefined);

    try {
      await aggregateWorkResultsAndCalculateProductivity(input);
      fail('ProficiencyDataMissingError がスローされるべき');
    } catch (error: any) {
      expect(error.message).toMatch(/W001/);
      expect(error.message).toMatch(/習熟度データが見つかりません/);
    }
  });

  it('出力型が返却されず、習熟度データ欠落エラーのみが発生する', async () => {
    const input = {
      handyTerminalWorkResults: [
        {
          workInstructionId: 'WI001',
          workerId: 'W001',
          facilityId: 'F001',
          teamId: 'T001',
          workStartDateTime: '2024-01-15T08:00:00Z',
          workEndDateTime: '2024-01-15T16:00:00Z',
          completedQuantity: 100,
          defectQuantity: 2,
          errorCount: 0,
          remarks: 'Test work',
        },
      ],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'USR001',
    };

    (dataPersistenceModule.getProficiencyById as jest.Mock).mockReturnValue(null);

    let output = undefined;
    try {
      output = await aggregateWorkResultsAndCalculateProductivity(input);
      fail('ProficiencyDataMissingError がスローされるべき');
    } catch (error: any) {
      expect(output).toBeUndefined();
      expect(error.constructor.name).toBe('ProficiencyDataMissingError');
    }
  });
});