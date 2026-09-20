import { recordWorkInstructionReceipt, RecordWorkInstructionReceiptInput } from '../../src/logic/work-execution-tracking';
import * as persistenceLayer from '../../src/logic/persistence-layer';
import * as authorizationValidation from '../../src/logic/authorization-and-validation';

jest.mock('../../src/logic/persistence-layer');
jest.mock('../../src/logic/authorization-and-validation');

describe('SCEN-302: recordWorkInstructionReceipt - Error Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When worker ID does not exist in worker master', () => {
    it('should throw WorkerNotFoundError with appropriate message', async () => {
      const input: RecordWorkInstructionReceiptInput = {
        workerId: 'NONEXISTENT_WORKER_001',
        instructionId: 'INST-001',
        instructionReceiptDateTime: new Date(),
        executionStartDateTime: new Date(),
      };

      (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue(null);

      let errorThrown = false;
      let thrownError: any = null;

      try {
        await recordWorkInstructionReceipt(input);
      } catch (error: any) {
        errorThrown = true;
        thrownError = error;
        expect(error.name).toBe('WorkerNotFoundError');
        expect(error.message).toBe('作業者ID NONEXISTENT_WORKER_001 が見つかりません。');
      }

      expect(errorThrown).toBe(true);
      expect(thrownError).not.toBeNull();
    });
  });

  describe('When worker is in inactive status', () => {
    it('should throw WorkerInactiveError with appropriate message', async () => {
      const input: RecordWorkInstructionReceiptInput = {
        workerId: 'WORKER_INACTIVE_001',
        instructionId: 'INST-002',
        instructionReceiptDateTime: new Date(),
        executionStartDateTime: new Date(),
      };

      (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
        workerId: 'WORKER_INACTIVE_001',
        workerName: 'Inactive Worker',
        siteId: 'SITE-001',
        teamId: 'TEAM-001',
        jobType: 'assembly',
        operationalStatus: 'inactive',
      });

      let errorThrown = false;
      let thrownError: any = null;

      try {
        await recordWorkInstructionReceipt(input);
      } catch (error: any) {
        errorThrown = true;
        thrownError = error;
        expect(error.name).toBe('WorkerInactiveError');
        expect(error.message).toBe('作業者ID WORKER_INACTIVE_001 は現在稼働状態にありません。');
      }

      expect(errorThrown).toBe(true);
      expect(thrownError).not.toBeNull();
    });
  });

  describe('When instruction is in non-receivable state', () => {
    it('should throw InvalidInstructionStateError with appropriate message', async () => {
      const input: RecordWorkInstructionReceiptInput = {
        workerId: 'WORKER_VALID_001',
        instructionId: 'INST_ALREADY_RECEIVED',
        instructionReceiptDateTime: new Date(),
        executionStartDateTime: new Date(),
      };

      (persistenceLayer.findWorkerById as jest.Mock).mockResolvedValue({
        workerId: 'WORKER_VALID_001',
        workerName: 'Valid Worker',
        siteId: 'SITE-001',
        teamId: 'TEAM-001',
        jobType: 'assembly',
        operationalStatus: 'active',
      });

      (authorizationValidation.validateInputData as jest.Mock).mockResolvedValue({
        isValid: false,
        instructionState: 'received',
        reason: 'Instruction already received',
      });

      let errorThrown = false;
      let thrownError: any = null;

      try {
        await recordWorkInstructionReceipt(input);
      } catch (error: any) {
        errorThrown = true;
        thrownError = error;
        expect(error.name).toBe('InvalidInstructionStateError');
        expect(error.message).toBe('指示ID INST_ALREADY_RECEIVED は受領できない状態です。');
      }

      expect(errorThrown).toBe(true);
      expect(thrownError).not.toBeNull();
    });
  });
});