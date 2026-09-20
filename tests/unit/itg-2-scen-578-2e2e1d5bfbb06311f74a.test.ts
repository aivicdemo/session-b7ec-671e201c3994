import { findPerformanceRecordsByPlacementPlan } from '../../src/logic/persistence-layer';
import * as authModule from '../../src/logic/authorization-and-validation';
import * as persistenceModule from '../../src/logic/persistence-layer';

describe('findPerformanceRecordsByPlacementPlan', () => {
  describe('when performance records exist for the specified placement plan', () => {
    it('should return found=true with accurate totalCount and performanceRecords array', async () => {
      const placementPlanId = 'plan-001';
      const requestingUserId = 'user-123';

      // Stub authorization
      jest.spyOn(authModule, 'authorizeUserAction').mockResolvedValueOnce(undefined);

      // Create mock performance records
      const mockPerformanceRecords = Array.from({ length: 15 }, (_, i) => ({
        performanceRecordId: `perf-record-${i + 1}`,
        workerId: `worker-${(i % 3) + 1}`,
        placementPlanId: placementPlanId,
        workDate: new Date(2024, 0, i + 1),
        workContent: `Work content ${i + 1}`,
        completionCount: 10 + i,
        requiredTimeMinutes: 480 + i * 10,
        qualityScore: 80 + (i % 10),
        remarks: `Remark ${i + 1}`,
        createdAt: new Date(2024, 0, i + 1),
        updatedAt: new Date(2024, 0, i + 1),
      }));

      // Sort mock records by workerId and then by workDate to simulate worker-grouped, date-ordered storage
      const sortedRecords = mockPerformanceRecords.sort((a, b) => {
        const workerCompare = a.workerId.localeCompare(b.workerId);
        if (workerCompare !== 0) return workerCompare;
        return a.workDate.getTime() - b.workDate.getTime();
      });

      // Mock the persistence layer call to return sorted, grouped records
      jest
        .spyOn(persistenceModule, 'findPerformanceRecordsByPlacementPlan')
        .mockResolvedValueOnce({
          performanceRecords: sortedRecords,
          totalCount: 15,
          found: true,
          placementPlanId: placementPlanId,
          placementPeriodStartDate: new Date('2024-01-01'),
          placementPeriodEndDate: new Date('2024-01-31'),
        });

      const result = await findPerformanceRecordsByPlacementPlan({
        placementPlanId: placementPlanId,
        requestingUserId: requestingUserId,
      });

      expect(result.found).toBe(true);
      expect(result.totalCount).toBe(15);
      expect(result.performanceRecords).toHaveLength(15);
      expect(result.performanceRecords.length).toBe(result.totalCount);
      expect(result.placementPlanId).toBe('plan-001');
      expect(result.placementPeriodStartDate).toEqual(new Date('2024-01-01'));
      expect(result.placementPeriodEndDate).toEqual(new Date('2024-01-31'));

      // Verify all records are within placement period
      result.performanceRecords.forEach((record) => {
        expect(record.workDate.getTime()).toBeGreaterThanOrEqual(
          new Date('2024-01-01').getTime()
        );
        expect(record.workDate.getTime()).toBeLessThanOrEqual(
          new Date('2024-01-31').getTime()
        );
      });

      // Verify records are grouped by worker and sorted by date within each worker
      let currentWorkerId = result.performanceRecords[0].workerId;
      let lastWorkDate = result.performanceRecords[0].workDate;

      for (let i = 1; i < result.performanceRecords.length; i++) {
        const record = result.performanceRecords[i];

        // Check if worker ID changed
        if (record.workerId !== currentWorkerId) {
          // Worker changed, update current worker
          currentWorkerId = record.workerId;
          lastWorkDate = record.workDate;
        } else {
          // Same worker, verify date ordering
          expect(record.workDate.getTime()).toBeGreaterThanOrEqual(
            lastWorkDate.getTime()
          );
          lastWorkDate = record.workDate;
        }
      }
    });
  });
});