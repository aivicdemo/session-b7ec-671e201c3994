import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import { RecordWorkInstructionReceiptInput } from '../../src/logic/work-execution-tracking';
import * as workExecutionTracking from '../../src/logic/work-execution-tracking';

describe('SCEN-304: 指示受領記録の保存に失敗したとき、DataPersistenceErrorが発生する', () => {
  it('指示受領記録の保存に失敗したとき、DataPersistenceErrorが発生する', async () => {
    const input: RecordWorkInstructionReceiptInput = {
      workerId: 'W001',
      instructionId: 'I001',
      instructionReceiptDateTime: new Date(),
      executionStartDateTime: new Date(),
    };

    // validateInputData()スタブを設定
    const validateInputDataSpy = jest.spyOn(workExecutionTracking as any, 'validateInputData').mockResolvedValue(true);

    // findWorkerById()スタブを設定
    const findWorkerByIdSpy = jest.spyOn(workExecutionTracking as any, 'findWorkerById').mockResolvedValue({
      workerId: 'W001',
      status: '稼働中',
    });

    // saveProductivityData()スタブを設定
    class DataPersistenceError extends Error {
      name = 'DataPersistenceError';
      constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, DataPersistenceError.prototype);
      }
    }

    const saveProductivityDataSpy = jest.spyOn(workExecutionTracking as any, 'saveProductivityData').mockRejectedValue(
      new DataPersistenceError('指示受領記録の保存に失敗しました。')
    );

    let thrownError: any = null;
    let output: any = undefined;

    try {
      output = await recordWorkInstructionReceipt(input);
    } catch (error) {
      thrownError = error;
    }

    // DataPersistenceErrorが発生したことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.name).toBe('DataPersistenceError');
    expect(thrownError.message).toBe('指示受領記録の保存に失敗しました。');

    // recordedAtフィールドを含む出力が返されないことを確認
    expect(output).toBeUndefined();

    // スパイのクリーンアップ
    validateInputDataSpy.mockRestore();
    findWorkerByIdSpy.mockRestore();
    saveProductivityDataSpy.mockRestore();
  });
});