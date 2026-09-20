import { getWorkResultById } from '../../src/logic/data-persistence';
import { GetWorkResultByIdInput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

describe('SCEN-714: getWorkResultById - 指定された作業実績IDが存在する場合、対応する作業実績データを返す', () => {
  it('should return work result data for a valid workResultId', async () => {
    // Arrange
    const input: GetWorkResultByIdInput = {
      workResultId: 'WR-20250115-001'
    };

    // Act
    const result = await getWorkResultById(input);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
    
    // Verify the result has GetWorkResultByIdOutput structure
    expect(result).toHaveProperty('workResultId');
    expect(result).toHaveProperty('workInstructionId');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('actualStartDateTime');
    expect(result).toHaveProperty('actualEndDateTime');
    expect(result).toHaveProperty('actualQuantity');
    expect(result).toHaveProperty('workStatus');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('createdBy');

    // Verify the data contains expected values
    expect(result.workResultId).toBe('WR-20250115-001');
    expect(typeof result.actualQuantity).toBe('number');
    expect(typeof result.actualEndDateTime).toBe('string');
    expect(typeof result.workStatus).toBe('string');
    expect(result.workStatus).toBeTruthy();
    expect(result.actualQuantity).toBeGreaterThanOrEqual(0);
  });
});