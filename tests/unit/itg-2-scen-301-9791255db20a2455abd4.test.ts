import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import * as workExecutionTracking from '../../src/logic/work-execution-tracking';

describe('SCEN-301: 作業者がハンディターミナルで指示受領ボタンをタップした時点での指示受領記録', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('指示受領記録が完全に保存され、基準点確立状態がestablishedで返される', async () => {
    const T0 = new Date('2025-01-15T10:30:00Z');
    jest.setSystemTime(T0);

    // validateInputData() スタブを設定
    const validateInputDataSpy = jest.spyOn(workExecutionTracking as any, 'validateInputData').mockReturnValue(true);

    // findWorkerById() スタブを設定
    const findWorkerByIdSpy = jest.spyOn(workExecutionTracking as any, 'findWorkerById').mockResolvedValue({
      workerId: 'W001',
      workerName: 'Test Worker',
      status: '稼働中',
    });

    // saveProductivityData() スタブを設定
    const saveProductivityDataSpy = jest.spyOn(workExecutionTracking as any, 'saveProductivityData').mockResolvedValue({
      productivityDataId: 'PROD-20250115-00001',
    });

    // synchronizeDataWithWESAndWMS() スタブを設定
    const synchronizeDataSpy = jest.spyOn(workExecutionTracking as any, 'synchronizeDataWithWESAndWMS').mockResolvedValue({
      success: true,
    });

    const input = {
      workerId: 'W001',
      instructionId: 'INS-20250115-001',
      instructionReceiptDateTime: T0,
      executionStartDateTime: T0,
    };

    const result = await recordWorkInstructionReceipt(input);

    expect(result).toBeDefined();
    expect(result.productivityDataId).toBe('PROD-20250115-00001');
    expect(result.workerId).toBe('W001');
    expect(result.instructionId).toBe('INS-20250115-001');
    expect(result.instructionReceiptDateTime).toEqual(T0);
    expect(result.executionStartDateTime).toEqual(T0);
    expect(result.progressMonitoringBaselineStatus).toBe('established');
    expect(result.recordedAt).toBeInstanceOf(Date);
    expect(result.recordedAt.getTime()).toBeGreaterThanOrEqual(T0.getTime());

    // saveProductivityData() が呼び出されたことを確認
    expect(saveProductivityDataSpy).toHaveBeenCalled();

    // saveProductivityData() に渡されたデータの内容を確認
    const saveProductivityDataCall = saveProductivityDataSpy.mock.calls[0][0];
    expect(saveProductivityDataCall).toMatchObject({
      workerId: 'W001',
      instructionId: 'INS-20250115-001',
    });
    expect(saveProductivityDataCall.instructionReceiptDateTime).toEqual(T0);
    expect(saveProductivityDataCall.executionStartDateTime).toEqual(T0);

    // synchronizeDataWithWESAndWMS() が呼び出されたことを確認
    expect(synchronizeDataSpy).toHaveBeenCalled();

    // クリーンアップ
    validateInputDataSpy.mockRestore();
    findWorkerByIdSpy.mockRestore();
    saveProductivityDataSpy.mockRestore();
    synchronizeDataSpy.mockRestore();
  });
});