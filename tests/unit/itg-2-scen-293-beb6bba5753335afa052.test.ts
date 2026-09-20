import { recordWorkExecutionStart, RecordWorkExecutionStartInput } from '../../src/logic/work-execution-tracking';
import * as workExecutionTracking from '../../src/logic/work-execution-tracking';

describe('SCEN-293: 作業開始記録とダッシュボード反映基準点確立', () => {
  let findWorkerByIdMock: jest.Mock;
  let findWorkTypeByIdMock: jest.Mock;
  let saveProductivityDataMock: jest.Mock;
  let synchronizeDataWithWESAndWMSMock: jest.Mock;

  beforeEach(() => {
    findWorkerByIdMock = jest.fn().mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      siteId: 'SITE-001',
      teamId: 'TEAM-001',
      status: 'active',
    });

    findWorkTypeByIdMock = jest.fn().mockResolvedValue({
      workTypeId: 'WT-PICKING',
      workTypeName: 'Picking Work',
      standardProductivity: 100,
    });

    saveProductivityDataMock = jest.fn().mockResolvedValue('PD-20250115-001');

    synchronizeDataWithWESAndWMSMock = jest.fn().mockResolvedValue({
      wes_sync_status: 'success',
      wms_sync_status: 'success',
    });

    jest.spyOn(workExecutionTracking, 'findWorkerById' as any).mockImplementation(findWorkerByIdMock);
    jest.spyOn(workExecutionTracking, 'findWorkTypeById' as any).mockImplementation(findWorkTypeByIdMock);
    jest.spyOn(workExecutionTracking, 'saveProductivityData' as any).mockImplementation(saveProductivityDataMock);
    jest.spyOn(workExecutionTracking, 'synchronizeDataWithWESAndWMS' as any).mockImplementation(synchronizeDataWithWESAndWMSMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('作業者・作業種別・商品が全て存在し、予定完了時刻が妥当な場合、作業開始を記録して生産性データIDを返し、ダッシュボード反映が進行中になる', async () => {
    const input: RecordWorkExecutionStartInput = {
      workerId: 'W001',
      workTypeId: 'WT-PICKING',
      targetProductId: 'SKU-12345',
      executionStartDateTime: new Date('2025-01-15T09:00:00Z'),
      scheduledCompletionDateTime: new Date('2025-01-15T09:30:00Z'),
      instructionId: 'INSTR-98765',
    };

    const result = await recordWorkExecutionStart(input);

    // Verify return type and structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty('productivityDataId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('executionStartDateTime');
    expect(result).toHaveProperty('dashboardReflectionStatus');
    expect(result).toHaveProperty('recordedAt');

    // Verify return values
    expect(result.productivityDataId).toBe('PD-20250115-001');
    expect(result.workerId).toBe('W001');
    expect(result.executionStartDateTime).toEqual(new Date('2025-01-15T09:00:00Z'));
    expect(result.dashboardReflectionStatus).toBe('pending');

    // Verify recordedAt is close to current time (within 1 second)
    const now = new Date();
    const recordedAtTime = new Date(result.recordedAt).getTime();
    const nowTime = now.getTime();
    expect(Math.abs(recordedAtTime - nowTime)).toBeLessThanOrEqual(1000);

    // Verify mock function calls
    expect(findWorkerByIdMock).toHaveBeenCalledWith('W001');
    expect(findWorkerByIdMock).toHaveBeenCalledTimes(1);

    expect(findWorkTypeByIdMock).toHaveBeenCalledWith('WT-PICKING');
    expect(findWorkTypeByIdMock).toHaveBeenCalledTimes(1);

    expect(saveProductivityDataMock).toHaveBeenCalledTimes(1);

    expect(synchronizeDataWithWESAndWMSMock).toHaveBeenCalledTimes(1);

    // Verify that the data was properly recorded by checking that the return values match input values
    expect(result.productivityDataId).toBeTruthy();
    expect(result.workerId).toBe(input.workerId);
    expect(result.executionStartDateTime).toEqual(input.executionStartDateTime);
  });
});