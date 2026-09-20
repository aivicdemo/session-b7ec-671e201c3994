import { saveTeam } from '../../src/logic/data-persistence';

describe('SCEN-554: Update with null updatedBy creates new team record', () => {
  it('should create a new team record when updatedBy is null', async () => {
    const input = {
      teamId: null,
      teamName: 'テストチームA',
      facilityId: 'FAC001',
      teamLeaderId: 'WKR001',
      teamDescription: null,
      operatingStatus: '稼働中',
      capacity: 5,
      createdBy: 'USR001',
      updatedBy: null,
    };

    const result = await saveTeam(input);

    expect(result.isNewRecord).toBe(true);
    expect(result.teamId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.teamName).toBe('テストチームA');
    expect(result.facilityId).toBe('FAC001');
    expect(result.savedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});