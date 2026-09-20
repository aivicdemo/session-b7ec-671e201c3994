import { findAllActiveWorkTypes } from '../../src/logic/persistence-layer';

describe('SCEN-603: 有効な作業タイプが複数件存在する場合、全レコードを取得できる', () => {
  it('有効フラグが立っている全作業タイプレコードを検索して取得する', async () => {
    // Arrange
    const requestingUserId = 'user-valid-001';

    // Act
    const result = await findAllActiveWorkTypes({
      requestingUserId,
    });

    // Assert
    expect(result.found).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(1);
    expect(result.workTypes).toBeDefined();
    expect(Array.isArray(result.workTypes)).toBe(true);

    if (result.totalCount > 0) {
      expect(result.workTypes.length).toBe(result.totalCount);

      result.workTypes.forEach((workType) => {
        expect(workType.workTypeId).toBeDefined();
        expect(typeof workType.workTypeId).toBe('string');
        expect(workType.workTypeName).toBeDefined();
        expect(typeof workType.workTypeName).toBe('string');
        expect(workType.standardProductivity).toBeDefined();
        expect(typeof workType.standardProductivity).toBe('number');
        expect(workType.difficultyLevel).toBeDefined();
        expect(typeof workType.difficultyLevel).toBe('string');
        expect(workType.activeFlag).toBe(true);
        expect(workType.createdAt).toBeDefined();
        expect(workType.updatedAt).toBeDefined();
      });
    }
  });
});