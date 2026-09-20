import {
  submitWorkPerformanceData,
  SubmitWorkPerformanceDataInput,
} from '../../src/logic/work-performance-data-input';

describe('SCEN-390: 作業開始時刻が作業終了時刻以上のとき、InvalidDateTimeErrorが発生する', () => {
  it('startTimeがendTime以上の場合、InvalidDateTimeErrorが発生する', async () => {
    const input: SubmitWorkPerformanceDataInput = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'type001',
      workDate: '2025-01-15',
      startTime: '14:30',
      endTime: '14:30',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      /作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。/
    );
  });

  it('startTimeがendTimeより後の場合、InvalidDateTimeErrorが発生する', async () => {
    const input: SubmitWorkPerformanceDataInput = {
      userId: 'user001',
      workerId: 'worker001',
      departmentId: 'dept001',
      workTypeId: 'type001',
      workDate: '2025-01-15',
      startTime: '15:00',
      endTime: '14:30',
      completedQuantity: 100,
      unit: '個',
      qualityScore: 'A',
      workDescription: '',
      remarks: '',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow(
      /作業日付または時刻が不正です。開始時刻は終了時刻より前である必要があります。/
    );
  });

  it('startTimeとendTimeが等しい場合、例外が発生する', async () => {
    const input: SubmitWorkPerformanceDataInput = {
      userId: 'user002',
      workerId: 'worker002',
      departmentId: 'dept002',
      workTypeId: 'type002',
      workDate: '2025-01-20',
      startTime: '10:00',
      endTime: '10:00',
      completedQuantity: 50,
      unit: '件',
      qualityScore: 'B',
      workDescription: '検査作業',
      remarks: '',
    };

    await expect(submitWorkPerformanceData(input)).rejects.toThrow();
  });
});