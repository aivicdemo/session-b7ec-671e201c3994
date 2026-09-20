import { saveWorkInstructionReceptionHistory } from '../../src/logic/data-persistence';
import { SaveWorkInstructionReceptionHistoryInput } from '../../src/logic/data-persistence';
import * as validationModule from '../../src/logic/validation-common-calculation';

jest.mock('../../src/logic/validation-common-calculation');

describe('SCEN-1025: InvalidWorkInstructionIdError when work instruction does not exist', () => {
  describe('saveWorkInstructionReceptionHistory', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw InvalidWorkInstructionIdError when work instruction ID does not exist', async () => {
      const nonexistentId = 'NONEXISTENT-WI-999999';
      
      (validationModule.validateReferentialIntegrity as jest.Mock).mockImplementation(
        (entityType: string, recordId: string) => {
          if (entityType === 'workInstruction' && recordId === nonexistentId) {
            const error = new Error(`作業指示ID '${recordId}' は存在しません。`);
            (error as any).code = 'InvalidWorkInstructionIdError';
            throw error;
          }
        }
      );

      const input: SaveWorkInstructionReceptionHistoryInput = {
        receptionHistoryId: null,
        workInstructionId: nonexistentId,
        workerId: 'worker-valid-id',
        receptionDateTime: new Date('2024-01-15T10:30:00Z').toISOString(),
        receptionStatus: 'pending',
        confirmationDateTime: undefined,
        deliveryMethod: 'handy_terminal',
        remarks: undefined,
        createdBy: 'user-valid-id',
        updatedBy: undefined,
      };

      await expect(saveWorkInstructionReceptionHistory(input)).rejects.toThrow(
        `作業指示ID '${nonexistentId}' は存在しません。`
      );
    });

    it('should include the work instruction ID in the error message', async () => {
      const nonexistentId = 'NONEXISTENT-WI-999999';
      
      (validationModule.validateReferentialIntegrity as jest.Mock).mockImplementation(
        (entityType: string, recordId: string) => {
          if (entityType === 'workInstruction' && recordId === nonexistentId) {
            const error = new Error(`作業指示ID '${recordId}' は存在しません。`);
            (error as any).code = 'InvalidWorkInstructionIdError';
            throw error;
          }
        }
      );

      const input: SaveWorkInstructionReceptionHistoryInput = {
        receptionHistoryId: null,
        workInstructionId: nonexistentId,
        workerId: 'worker-valid-id',
        receptionDateTime: new Date('2024-01-15T10:30:00Z').toISOString(),
        receptionStatus: 'confirmed',
        confirmationDateTime: new Date('2024-01-15T10:35:00Z').toISOString(),
        deliveryMethod: 'email',
        remarks: 'Test remark',
        createdBy: 'user-valid-id',
        updatedBy: undefined,
      };

      try {
        await saveWorkInstructionReceptionHistory(input);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain(nonexistentId);
        expect(error.message).toContain('存在しません');
        expect(error.message).toContain('作業指示ID');
      }
    });

    it('should not return SaveWorkInstructionReceptionHistoryOutput when error occurs', async () => {
      const nonexistentId = 'NONEXISTENT-WI-999999';
      
      (validationModule.validateReferentialIntegrity as jest.Mock).mockImplementation(
        (entityType: string, recordId: string) => {
          if (entityType === 'workInstruction' && recordId === nonexistentId) {
            const error = new Error(`作業指示ID '${recordId}' は存在しません。`);
            (error as any).code = 'InvalidWorkInstructionIdError';
            throw error;
          }
        }
      );

      const input: SaveWorkInstructionReceptionHistoryInput = {
        receptionHistoryId: null,
        workInstructionId: nonexistentId,
        workerId: 'worker-valid-id',
        receptionDateTime: new Date().toISOString(),
        receptionStatus: 'pending',
        confirmationDateTime: undefined,
        deliveryMethod: 'system_notification',
        remarks: undefined,
        createdBy: 'user-valid-id',
        updatedBy: undefined,
      };

      await expect(saveWorkInstructionReceptionHistory(input)).rejects.toBeDefined();
    });

    it('should validate work instruction existence before creating reception history', async () => {
      const fakeId = 'WI-FAKE-ID-12345';
      
      (validationModule.validateReferentialIntegrity as jest.Mock).mockImplementation(
        (entityType: string, recordId: string) => {
          if (entityType === 'workInstruction' && recordId === fakeId) {
            const error = new Error(`作業指示ID '${recordId}' は存在しません。`);
            (error as any).code = 'InvalidWorkInstructionIdError';
            throw error;
          }
        }
      );

      const input: SaveWorkInstructionReceptionHistoryInput = {
        receptionHistoryId: null,
        workInstructionId: fakeId,
        workerId: 'worker-id-001',
        receptionDateTime: new Date('2024-01-20T14:00:00Z').toISOString(),
        receptionStatus: 'rejected',
        confirmationDateTime: new Date('2024-01-20T14:05:00Z').toISOString(),
        deliveryMethod: 'handy_terminal',
        remarks: 'Rejected due to schedule conflict',
        createdBy: 'user-id-001',
        updatedBy: undefined,
      };

      await expect(
        saveWorkInstructionReceptionHistory(input)
      ).rejects.toThrow();
    });

    it('should fail with nonexistent work instruction even with valid other fields', async () => {
      const nonexistentId = 'NONEXISTENT-ID-XXXXXX';
      
      (validationModule.validateReferentialIntegrity as jest.Mock).mockImplementation(
        (entityType: string, recordId: string) => {
          if (entityType === 'workInstruction' && recordId === nonexistentId) {
            const error = new Error(`作業指示ID '${recordId}' は存在しません。`);
            (error as any).code = 'InvalidWorkInstructionIdError';
            throw error;
          }
        }
      );

      const input: SaveWorkInstructionReceptionHistoryInput = {
        receptionHistoryId: null,
        workInstructionId: nonexistentId,
        workerId: 'valid-worker-uuid-here',
        receptionDateTime: '2024-02-10T09:15:00.000Z',
        receptionStatus: 'confirmed',
        confirmationDateTime: '2024-02-10T09:20:00.000Z',
        deliveryMethod: 'email',
        remarks: 'All other fields are valid',
        createdBy: 'valid-user-uuid-here',
        updatedBy: undefined,
      };

      await expect(
        saveWorkInstructionReceptionHistory(input)
      ).rejects.toThrow(`作業指示ID '${nonexistentId}' は存在しません。`);
    });
  });
});