import { recordWorkInstructionReceipt } from '../../src/logic/work-execution-tracking';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationAndValidation from '../../src/logic/authorization-and-validation';
import * as notificationAndIntegration from '../../src/logic/notification-and-integration';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');
jest.mock('../../src/logic/notification-and-integration');

describe('SCEN-313: 指示受領時の基準点確立失敗時の処理', () => {
  const mockWorker = {
    作業者ID: 'WORKER001',
    作業者名: 'Test Worker',
    拠点ID: 'SITE-001',
    チームID: 'TEAM-001',
    職種: 'assembly',
    稼働状況: '稼働中',
  };

  const mockSavedProductivityData = {
    productivityDataId: 'PROD-DATA-001',
    workerId: 'WORKER001',
    instructionId: 'INSTR-20240115-001',
    instructionReceiptDateTime: new Date('2024-01-15T09:00:00Z'),
    executionStartDateTime: new Date('2024-01-15T09:00:05Z'),
    recordedAt: new Date('2024-01-15T09:00:05Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('外部システム連携に失敗したとき、基準点確立状態がfailedで返される', async () => {
    // モック設定: findWorkerByIdが有効な作業者を返す
    (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue(mockWorker);

    // モック設定: validateInputDataが入力データを有効と判定する
    (authorizationAndValidation.validateInputData as jest.Mock).mockResolvedValue(true);

    // モック設定: saveProductivityDataが正常に保存されたレコードを返す
    (persistenceLayer.saveProductivityData as jest.Mock).mockResolvedValue(
      mockSavedProductivityData
    );

    // モック設定: synchronizeDataWithWESAndWMSが外部システム連携に失敗する
    (notificationAndIntegration.synchronizeDataWithWESAndWMS as jest.Mock).mockRejectedValue(
      new Error('Network timeout connecting to WES')
    );

    // recordWorkInstructionReceiptを呼び出す
    const input = {
      workerId: 'WORKER001',
      instructionId: 'INSTR-20240115-001',
      instructionReceiptDateTime: new Date('2024-01-15T09:00:00Z'),
      executionStartDateTime: new Date('2024-01-15T09:00:05Z'),
    };

    const result = await recordWorkInstructionReceipt(input);

    // 検証: progressMonitoringBaselineStatusが'failed'である
    expect(result.progressMonitoringBaselineStatus).toBe('failed');

    // 検証: 基本フィールドが有効な値を持つ
    expect(result.productivityDataId).toBe('PROD-DATA-001');
    expect(result.workerId).toBe('WORKER001');
    expect(result.instructionId).toBe('INSTR-20240115-001');
    expect(result.instructionReceiptDateTime).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(result.executionStartDateTime).toEqual(new Date('2024-01-15T09:00:05Z'));
    expect(result.recordedAt).toEqual(new Date('2024-01-15T09:00:05Z'));

    // 検証: エラーは発生していない（正常に結果が返される）
    expect(result).toBeDefined();
    expect(result).toHaveProperty('progressMonitoringBaselineStatus');
    expect(result).toHaveProperty('productivityDataId');
  });
});