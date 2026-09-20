import { deleteDataByIdAndType } from '../../src/logic/data-persistence';
import { DeleteDataByIdAndTypeOutput } from '../../src/logic/data-persistence';

describe('deleteDataByIdAndType', () => {
  it('should logically delete a facility record and return deletion result', async () => {
    const input = {
      dataType: 'facility',
      recordId: '12345',
      deletedBy: 'user-001',
    };

    const result = await deleteDataByIdAndType(input);

    expect(result).toBeDefined();
    expect(result.dataType).toBe('facility');
    expect(result.recordId).toBe('12345');
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.isLogicalDelete).toBe(true);
  });
});