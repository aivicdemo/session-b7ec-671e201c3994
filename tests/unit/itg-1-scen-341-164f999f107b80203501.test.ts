import { aggregateWorkResultsAndCalculateProductivity } from '../../src/logic/work-result-productivity-aggregation';

describe('SCEN-341: aggregateWorkResultsAndCalculateProductivity - Empty Input Arrays', () => {
  it('should return empty productivity data and success status when input arrays are empty', async () => {
    // Arrange
    const input = {
      handyTerminalWorkResults: [],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'user-001',
    };

    // Act
    const output = await aggregateWorkResultsAndCalculateProductivity(input);

    // Assert - aggregatedProductivityData should be empty
    expect(output.aggregatedProductivityData).toEqual([]);
    expect(Array.isArray(output.aggregatedProductivityData)).toBe(true);

    // Assert - processingStatistics validation
    expect(output.processingStatistics).toBeDefined();
    expect(output.processingStatistics.totalRecordsProcessed).toBe(0);
    expect(output.processingStatistics.successfullyAggregated).toBe(0);
    expect(output.processingStatistics.failedRecords).toBe(0);
    expect(output.processingStatistics.conflictRecords).toBe(0);
    expect(typeof output.processingStatistics.processingDurationMs).toBe('number');
    expect(output.processingStatistics.processingDurationMs).toBeGreaterThanOrEqual(0);

    // Assert - persistenceResult validation
    expect(output.persistenceResult).toBeDefined();
    expect(output.persistenceResult.savedProductivityRecords).toBe(0);
    expect(output.persistenceResult.savedWorkResultRecords).toBe(0);
    expect(output.persistenceResult.persistenceStatus).toBe('success');

    // Assert - dataConflicts should not exist or be empty
    if (output.dataConflicts !== undefined) {
      expect(Array.isArray(output.dataConflicts)).toBe(true);
      expect(output.dataConflicts.length).toBe(0);
    }
  });

  it('should not throw any expected errors when processing empty input', async () => {
    // Arrange
    const input = {
      handyTerminalWorkResults: [],
      wmsWorkResults: [],
      aggregationDate: '2024-01-15',
      executingUserId: 'user-001',
    };

    // Act & Assert
    await expect(
      aggregateWorkResultsAndCalculateProductivity(input)
    ).resolves.not.toThrow();
  });
});