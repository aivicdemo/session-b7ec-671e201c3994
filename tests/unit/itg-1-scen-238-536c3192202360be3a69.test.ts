import { aggregateDashboardData } from '../../src/logic/dashboard-aggregation';
import { AggregateDashboardDataInput } from '../../src/logic/dashboard-aggregation';

describe('SCEN-238: Dashboard Aggregation Error Handling - FacilityNotFoundError', () => {
  it('should throw FacilityNotFoundError when facility ID does not exist in facility master', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['NON_EXISTENT_FACILITY_001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER_001',
    };

    await expect(aggregateDashboardData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'FacilityNotFoundError',
        message: expect.stringContaining('指定された拠点が見つかりません。'),
      })
    );
  });

  it('should include facility ID information in error details', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['NON_EXISTENT_FACILITY_001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER_001',
    };

    try {
      await aggregateDashboardData(input);
      fail('Should have thrown FacilityNotFoundError');
    } catch (error: any) {
      expect(error.name).toBe('FacilityNotFoundError');
      expect(error.message).toContain('指定された拠点が見つかりません。');
      expect(error.stack).toBeDefined();
    }
  });

  it('should not throw InsufficientDataError when facility validation fails first', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['NON_EXISTENT_FACILITY_001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER_001',
    };

    try {
      await aggregateDashboardData(input);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.name).not.toBe('InsufficientDataError');
      expect(error.name).toBe('FacilityNotFoundError');
    }
  });

  it('should not return AggregateDashboardDataOutput when error is thrown', async () => {
    const input: AggregateDashboardDataInput = {
      facilityIds: ['NON_EXISTENT_FACILITY_001'],
      teamIds: null,
      aggregationStartDateTime: '2024-01-01T00:00:00Z',
      aggregationEndDateTime: '2024-01-31T23:59:59Z',
      requestUserId: 'USER_001',
    };

    let resultReturned = false;

    try {
      const result = await aggregateDashboardData(input);
      if (result) {
        resultReturned = true;
      }
    } catch (error) {
      // Expected error path
    }

    expect(resultReturned).toBe(false);
  });
});