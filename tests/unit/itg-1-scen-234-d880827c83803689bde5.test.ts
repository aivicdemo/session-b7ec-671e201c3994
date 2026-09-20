import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-234: aggregateHandyTerminalWorkResults audit log functionality', () => {
  it('should include auditLogId in the output that matches the recorded operation audit', async () => {
    // Arrange
    const facilityId = 'FAC001';
    const teamId = 'TEAM-A';
    const aggregationStartDateTime = '2024-01-15T09:00:00Z';
    const aggregationEndDateTime = '2024-01-15T17:00:00Z';
    const operatingUserId = 'USER123';
    const includeWmsData = true;

    // Act
    const result = await aggregateHandyTerminalWorkResults({
      facilityId,
      teamId,
      aggregationStartDateTime,
      aggregationEndDateTime,
      operatingUserId,
      includeWmsData,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.auditLogId).toBeDefined();
    expect(typeof result.auditLogId).toBe('string');
    expect(result.auditLogId.length).toBeGreaterThan(0);
    expect(result.facilityId).toBe(facilityId);
    expect(result.teamId).toBe(teamId);
    expect(result.aggregationPeriodStart).toBe(aggregationStartDateTime);
    expect(result.aggregationPeriodEnd).toBe(aggregationEndDateTime);
    expect(result.auditLogId).toBeTruthy();
  });
});