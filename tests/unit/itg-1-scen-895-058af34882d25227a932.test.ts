import { getProgressDataById } from '../../src/logic/data-persistence';

describe('SCEN-895: 進捗データ取得機能', () => {
  it('有効な進捗データIDで進捗データを取得すると、対応するデータが返される', async () => {
    // Arrange
    const validProgressDataId = 'PROG-2024-001';
    const input = {
      progressDataId: validProgressDataId,
    };

    // Act
    const result = await getProgressDataById(input);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    expect(result.progressDataId).toBe(validProgressDataId);
    expect(result.workInstructionId).toBeDefined();
    expect(typeof result.workInstructionId).toBe('string');
    expect(result.facilityId).toBeDefined();
    expect(typeof result.facilityId).toBe('string');
    expect(result.teamId).toBeDefined();
    expect(typeof result.teamId).toBe('string');
    expect(result.progressDate).toBeDefined();
    expect(typeof result.progressDate).toBe('string');
    expect(result.plannedQuantity).toBeDefined();
    expect(typeof result.plannedQuantity).toBe('number');
    expect(result.actualQuantity).toBeDefined();
    expect(typeof result.actualQuantity).toBe('number');
    expect(result.createdAt).toBeDefined();
    expect(typeof result.createdAt).toBe('string');
    expect(result.updatedAt).toBeDefined();
    expect(typeof result.updatedAt).toBe('string');
    expect(result.createdBy).toBeDefined();
    expect(typeof result.createdBy).toBe('string');
    // completionRate と delayFlag は optional フィールド
    if (result.completionRate !== undefined) {
      expect(typeof result.completionRate).toBe('number');
    }
    if (result.delayFlag !== undefined) {
      expect(typeof result.delayFlag).toBe('boolean');
    }
  });
});