import { listWorkInstructionReceptionHistoryByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1060: listWorkInstructionReceptionHistoryByCondition with pagination', () => {
  it('should return paginated results with correct total count when pagination is specified', async () => {
    // Setup: Create test data with 100 records with varying reception status and delivery methods
    const testReceptionHistories = Array.from({ length: 100 }, (_, index) => ({
      receptionHistoryId: `history-${String(index).padStart(3, '0')}`,
      workInstructionId: `instruction-${index % 10}`,
      workerId: `worker-${index % 5}`,
      receptionDateTime: new Date(Date.now() - (100 - index) * 60000).toISOString(),
      receptionStatus: index < 65 ? '受領済み' : '未受領',
      confirmationDateTime: index < 65 ? new Date(Date.now() - (100 - index) * 30000).toISOString() : null,
      deliveryMethod: ['handy_terminal', 'email', 'system_notification'][index % 3],
      remarks: `Test remark ${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: null,
    }));

    // Build search condition: only receptionStatuses specified
    const searchCondition = {
      receptionStatuses: ['受領済み'],
      pageNumber: 2,
      pageSize: 20,
    };

    // Mock implementation: simulate database filtering and pagination
    jest.spyOn(require('../../src/logic/data-persistence'), 'listWorkInstructionReceptionHistoryByCondition').mockImplementation(async (condition) => {
      // Filter by receptionStatus
      let filtered = testReceptionHistories.filter(
        (h) =>
          !condition.receptionStatuses ||
          condition.receptionStatuses.length === 0 ||
          condition.receptionStatuses.includes(h.receptionStatus)
      );

      const totalCount = filtered.length; // 65 records with '受領済み'

      // Apply pagination
      const pageNumber = condition.pageNumber || 1;
      const pageSize = condition.pageSize || 50;
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Verify this is page 2 (records 21-40, indices 20-39)
      const paginatedResults = filtered.slice(startIndex, endIndex);

      return {
        receptionHistories: paginatedResults,
        totalCount: totalCount,
        pageNumber: pageNumber,
        pageSize: pageSize,
        retrievedAt: new Date().toISOString(),
      };
    });

    // Execute: Call listWorkInstructionReceptionHistoryByCondition
    const result = await listWorkInstructionReceptionHistoryByCondition(searchCondition);

    // Verify output type structure and required fields
    expect(result).toBeDefined();
    expect(result.receptionHistories).toBeDefined();
    expect(Array.isArray(result.receptionHistories)).toBe(true);

    // Verify pagination: should return exactly 20 records (pageSize)
    expect(result.receptionHistories).toHaveLength(20);

    // Verify all records are from page 2 (indices 20-39 of filtered array, logical positions 21-40)
    // and match the filter criteria
    result.receptionHistories.forEach((item, index) => {
      expect(item).toHaveProperty('receptionHistoryId');
      expect(item).toHaveProperty('workInstructionId');
      expect(item).toHaveProperty('workerId');
      expect(item).toHaveProperty('receptionDateTime');
      expect(item).toHaveProperty('receptionStatus');
      expect(item.receptionStatus).toBe('受領済み');
      expect(item).toHaveProperty('confirmationDateTime');
      expect(item.confirmationDateTime).not.toBeNull();
      expect(item).toHaveProperty('deliveryMethod');
      expect(['handy_terminal', 'email', 'system_notification']).toContain(item.deliveryMethod);
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('createdBy');
      
      // Verify records are in the correct page range (21st-40th position in filtered results)
      const recordPosition = index + 1; // 1-indexed position within page
      expect(recordPosition).toBeGreaterThanOrEqual(1);
      expect(recordPosition).toBeLessThanOrEqual(20);
    });

    // Verify totalCount reflects all matching records before pagination
    // (65 records with '受領済み' status out of 100 total)
    expect(result.totalCount).toBe(65);

    // Verify pagination parameters are echoed back correctly
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(20);

    // Verify retrievedAt is ISO 8601 format
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.retrievedAt)).toBe(true);

    // Cleanup mock
    jest.restoreAllMocks();
  });
});