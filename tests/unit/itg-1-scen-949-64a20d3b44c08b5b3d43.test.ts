import { saveProductivityData } from '../../src/logic/data-persistence';
import { SaveProductivityDataInput } from '../../src/logic/data-persistence';

describe('SCEN-949: ProductivityMetricsCalculationError for out-of-range productivity metrics', () => {
  it('should throw ProductivityMetricsCalculationError when productivityRate is outside 0.0-1.0 range', async () => {
    const invalidInput: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR001',
      workerId: 'WK001',
      facilityId: 'FAC001',
      teamId: 'TM001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 1.5,
      qualityScore: 0.8,
      errorCount: 0,
      proficiencyLevel: '中級',
      createdBy: 'USR001',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'ProductivityMetricsCalculationError',
        message: expect.stringContaining('生産性指標の計算に失敗しました'),
      })
    );
  });

  it('should throw ProductivityMetricsCalculationError when qualityScore is outside 0.0-1.0 range', async () => {
    const invalidInput: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR001',
      workerId: 'WK001',
      facilityId: 'FAC001',
      teamId: 'TM001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9,
      qualityScore: 1.5,
      errorCount: 0,
      proficiencyLevel: '中級',
      createdBy: 'USR001',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'ProductivityMetricsCalculationError',
      })
    );
  });

  it('should throw ProductivityMetricsCalculationError when productivityRate is negative', async () => {
    const invalidInput: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR001',
      workerId: 'WK001',
      facilityId: 'FAC001',
      teamId: 'TM001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: -0.5,
      qualityScore: 0.8,
      errorCount: 0,
      proficiencyLevel: '中級',
      createdBy: 'USR001',
    };

    await expect(saveProductivityData(invalidInput)).rejects.toThrow(
      expect.objectContaining({
        name: 'ProductivityMetricsCalculationError',
      })
    );
  });

  it('should not throw error when all productivity metrics are within valid range', async () => {
    const validInput: SaveProductivityDataInput = {
      productivityDataId: null,
      workResultId: 'WR001',
      workerId: 'WK001',
      facilityId: 'FAC001',
      teamId: 'TM001',
      workDate: '2024-01-15',
      plannedWorkTime: 480,
      actualWorkTime: 450,
      completedItemCount: 100,
      productivityRate: 0.9,
      qualityScore: 0.85,
      errorCount: 2,
      proficiencyLevel: '中級',
      createdBy: 'USR001',
    };

    const result = await saveProductivityData(validInput);
    expect(result).toBeDefined();
    expect(result.productivityRate).toBe(0.9);
    expect(result.qualityScore).toBe(0.85);
  });
});