import { getProficiencyById } from '../../src/logic/data-persistence';

describe('SCEN-645: 有効な習熟度IDで習熟度データを取得', () => {
  it('指定された習熟度IDに対応する作業者習熟度データを検索して返す', async () => {
    // Arrange
    const validProficiencyId = 'PROF-001';

    // Act
    const result = await getProficiencyById({ proficiencyId: validProficiencyId });

    // Assert
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    expect(result?.proficiencyId).toBe(validProficiencyId);
    expect(result?.workerId).toBeDefined();
    expect(result?.jobType).toBeDefined();
    expect(result?.proficiencyLevel).toBeDefined();
    expect(result?.evaluationDate).toBeDefined();
    expect(result?.evaluatedBy).toBeDefined();
    expect(result?.createdAt).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
    expect(result?.createdBy).toBeDefined();
  });
});