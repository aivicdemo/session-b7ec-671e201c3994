import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';

describe('SCEN-387: 作業実績データ入力の必須フィールド検証', () => {
  it('必須フィールドのいずれかが未入力のとき、MissingRequiredFieldErrorが発生する', async () => {
    const input = {
      userId: 'user-123',
      workerId: null as any,
      departmentId: 'dept-001',
      workTypeId: 'type-001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '17:00',
      completedQuantity: 10,
      unit: '個',
      qualityScore: 'A',
    };

    let errorThrown: Error | null = null;
    try {
      await submitWorkPerformanceData(input);
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.name).toBe('MissingRequiredFieldError');
    expect(errorThrown?.message).toBe('必須項目が入力されていません。');
  });
});