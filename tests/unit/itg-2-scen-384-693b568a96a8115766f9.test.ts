import { submitWorkPerformanceData } from '../../src/logic/work-performance-data-input';

describe('SCEN-384: 作業日付が未来日または時刻形式が不正なとき、InvalidDateTimeErrorが発生する', () => {
  it('未来日（2025-12-25）を作業日付に指定した場合、InvalidDateTimeErrorが発生する', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2025-12-25',
      startTime: '09:00',
      endTime: '17:00',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toMatchObject({
      name: 'InvalidDateTimeError',
      message: '作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。',
    });
  });

  it('時刻形式が不正（25:00）な場合、InvalidDateTimeErrorが発生する', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2024-01-15',
      startTime: '25:00',
      endTime: '17:00',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toMatchObject({
      name: 'InvalidDateTimeError',
      message: '作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。',
    });
  });

  it('分の値が不正（09:60）な場合、InvalidDateTimeErrorが発生する', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2024-01-15',
      startTime: '09:60',
      endTime: '17:00',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toMatchObject({
      name: 'InvalidDateTimeError',
      message: '作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。',
    });
  });

  it('開始時刻（09:00）が終了時刻（08:00）以上である場合、InvalidDateTimeErrorが発生する', async () => {
    const input = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'worktype001',
      workDate: '2024-01-15',
      startTime: '09:00',
      endTime: '08:00',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toMatchObject({
      name: 'InvalidDateTimeError',
      message: '作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。',
    });
  });
});