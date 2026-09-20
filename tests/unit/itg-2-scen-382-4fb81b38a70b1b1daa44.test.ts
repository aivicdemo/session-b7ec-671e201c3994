import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';

describe('SCEN-382: 指定された部門IDが存在しないとき、InvalidDepartmentErrorが発生する', () => {
  it('should throw InvalidDepartmentError when department does not exist', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept-nonexistent',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDepartmentError',
        message: '指定された部門は見つかりません。または無効な状態です。',
      })
    );
  });

  it('should throw InvalidDepartmentError when department status is invalid', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept-inactive',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidDepartmentError',
        message: '指定された部門は見つかりません。または無効な状態です。',
      })
    );
  });

  it('should not return SubmitWorkPerformanceDataOutput when department validation fails', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept-nonexistent',
      workTypeId: 'type001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      completedQuantity: 50,
      unit: '個',
      qualityScore: 'A',
    };

    let result: any = undefined;
    let exceptionThrown = false;

    try {
      result = await submitWorkPerformanceData(input);
    } catch (error) {
      exceptionThrown = true;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('InvalidDepartmentError');
    }

    expect(exceptionThrown).toBe(true);
    expect(result).toBeUndefined();
  });
});