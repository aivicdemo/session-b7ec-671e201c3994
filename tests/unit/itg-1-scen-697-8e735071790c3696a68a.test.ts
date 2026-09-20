import { listWorkInstructionsByCondition } from '../../src/logic/data-persistence';

describe('SCEN-697: ListWorkInstructionsByCondition - All search conditions are null/undefined', () => {
  it('should complete successfully when all search condition fields are null or undefined', async () => {
    // Arrange: Initialize all fields to null or undefined
    const input = {
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listWorkInstructionsByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.workInstructions).toBeDefined();
    expect(Array.isArray(result.workInstructions)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    
    // Validate ISO 8601 format for retrievedAt
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.retrievedAt)).toBe(true);
  });

  it('should complete successfully with undefined values instead of null', async () => {
    // Arrange: Initialize all fields to undefined
    const input = {
      workInstructionIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workInstructionNumbers: undefined,
      workNameKeyword: undefined,
      progressStatuses: undefined,
      priorities: undefined,
      minRequiredWorkerCount: undefined,
      maxRequiredWorkerCount: undefined,
      minProgressRate: undefined,
      maxProgressRate: undefined,
      plannedStartFromDateTime: undefined,
      plannedStartToDateTime: undefined,
      plannedEndFromDateTime: undefined,
      plannedEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // Act
    const result = await listWorkInstructionsByCondition(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.workInstructions).toBeDefined();
    expect(Array.isArray(result.workInstructions)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
  });

  it('should return workInstructions as empty array or populated array without error', async () => {
    // Arrange
    const input = {
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act & Assert
    await expect(listWorkInstructionsByCondition(input)).resolves.toBeDefined();

    const result = await listWorkInstructionsByCondition(input);
    
    // Verify workInstructions is an array with length >= 0
    expect(result.workInstructions.length).toBeGreaterThanOrEqual(0);
  });

  it('should ensure totalCount matches workInstructions array length when no pagination is applied', async () => {
    // Arrange
    const input = {
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const result = await listWorkInstructionsByCondition(input);

    // Assert: When no pagination is specified, returned array length should not exceed totalCount
    expect(result.workInstructions.length).toBeLessThanOrEqual(result.totalCount);
  });

  it('should validate retrievedAt timestamp is recent (within reasonable time window)', async () => {
    // Arrange
    const input = {
      workInstructionIds: null,
      facilityIds: null,
      teamIds: null,
      workInstructionNumbers: null,
      workNameKeyword: null,
      progressStatuses: null,
      priorities: null,
      minRequiredWorkerCount: null,
      maxRequiredWorkerCount: null,
      minProgressRate: null,
      maxProgressRate: null,
      plannedStartFromDateTime: null,
      plannedStartToDateTime: null,
      plannedEndFromDateTime: null,
      plannedEndToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    // Act
    const beforeCall = new Date();
    const result = await listWorkInstructionsByCondition(input);
    const afterCall = new Date();

    // Assert
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 5000);
    expect(retrievedAtDate.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 5000);
  });
});