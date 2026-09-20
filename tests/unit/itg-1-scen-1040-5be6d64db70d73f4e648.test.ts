import { getWorkInstructionReceptionHistoryById } from '../../src/logic/data-persistence';
import { GetWorkInstructionReceptionHistoryByIdInput, GetWorkInstructionReceptionHistoryByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-1040: 有効な受領履歴IDで照会すると、対応する受領履歴データが返される', () => {
  it('指定された受領履歴IDに対応する作業指示受領履歴データを返す', async () => {
    const input: GetWorkInstructionReceptionHistoryByIdInput = {
      receptionHistoryId: 'RH-20250115-001',
    };

    const result: GetWorkInstructionReceptionHistoryByIdOutput = await getWorkInstructionReceptionHistoryById(input);

    expect(result).toBeDefined();
    expect(result.receptionHistoryId).toBe('RH-20250115-001');
    expect(result.workInstructionId).toBeDefined();
    expect(result.workerId).toBeDefined();
    expect(result.receptionDateTime).toBeDefined();
    expect(result.receptionStatus).toBeDefined();
    expect(['pending', 'confirmed', 'rejected']).toContain(result.receptionStatus);
    expect(result.deliveryMethod).toBeDefined();
    expect(['handy_terminal', 'email', 'system_notification']).toContain(result.deliveryMethod);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdBy).toBeDefined();
  });
});