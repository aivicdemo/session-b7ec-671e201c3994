import { getWorkInstructionReceptionHistoryById } from '../../src/logic/data-persistence';

describe('SCEN-1041: getWorkInstructionReceptionHistoryById with non-existent ID', () => {
  it('should return null when reception history ID does not exist in database', async () => {
    // Arrange
    const nonExistentId = 'non-existent-id-12345';

    // Act
    const result = await getWorkInstructionReceptionHistoryById({
      receptionHistoryId: nonExistentId,
    });

    // Assert
    expect(result).toBeNull();
  });
});