import { recordWorkExecutionStart } from '../../src/logic/work-execution-tracking';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as notificationAndIntegration from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/notification-and-integration');

describe('SCEN-297: 作業開始時に指示IDが存在しない場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指示IDがシステムに存在しない場合、指示が見つからない旨を示すエラーが発生する', async () => {
    const workerId = 'W001';
    const workTypeId = 'WT001';
    const targetProductId = 'P001';
    const executionStartDateTime = new Date();
    const scheduledCompletionDateTime = new Date(executionStartDateTime.getTime() + 60 * 60 * 1000);
    const instructionId = 'INST-999999';

    const validWorker = {
      id: workerId,
      name: 'Test Worker',
      siteId: 'SITE001',
      teamId: 'TEAM001',
      status: 'active',
    };

    const validWorkType = {
      id: workTypeId,
      name: 'Test Work Type',
      difficulty: 1,
    };

    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue(validWorker);
    (persistenceLayer.findWorkTypeById as jest.Mock).mockResolvedValue(validWorkType);
    (persistenceLayer.findInstructionById as jest.Mock).mockResolvedValue(null);

    const input = {
      workerId,
      workTypeId,
      targetProductId,
      executionStartDateTime,
      scheduledCompletionDateTime,
      instructionId,
    };

    await expect(recordWorkExecutionStart(input)).rejects.toThrow(
      /指示が見つかりません。最新の指示を再度読み込んでください/
    );

    expect(persistenceLayer.saveProductivityData).not.toHaveBeenCalled();
    expect(notificationAndIntegration.synchronizeDataWithWESAndWMS).not.toHaveBeenCalled();
  });
});