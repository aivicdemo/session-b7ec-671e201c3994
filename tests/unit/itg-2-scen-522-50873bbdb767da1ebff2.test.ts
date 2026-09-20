import { findInitialAssignmentByWorker } from '../../src/logic/persistence-layer';

describe('findInitialAssignmentByWorker', () => {
  it('権限のある利用者が有効な作業者IDで初期割当レコードを検索すると、割当部門・工程・期間・ステータス・備考を含む割当情報が返される', async () => {
    const workerId = 'W001';
    const requestingUserId = 'U001';

    const result = await findInitialAssignmentByWorker({
      workerId,
      requestingUserId,
    });

    expect(result.found).toBe(true);
    expect(result.assignmentId).toBeDefined();
    expect(typeof result.assignmentId).toBe('string');
    
    expect(result.workerId).toBe('W001');
    
    expect(result.placementDepartment).toBeDefined();
    expect(typeof result.placementDepartment).toBe('string');
    
    expect(result.placementProcess).toBeDefined();
    expect(typeof result.placementProcess).toBe('string');
    
    expect(result.assignmentStartDate).toBeInstanceOf(Date);
    expect(result.assignmentEndDate).toBeInstanceOf(Date);
    
    expect(['active', 'completed', 'cancelled']).toContain(result.assignmentStatus);
    
    if (result.remarks !== null) {
      expect(typeof result.remarks).toBe('string');
    }
    
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});