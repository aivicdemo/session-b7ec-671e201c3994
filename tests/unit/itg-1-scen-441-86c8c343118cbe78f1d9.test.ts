import { calculateWorkHours } from '../../src/logic/validation-common-calculation';

describe('SCEN-441: calculateWorkHours - 休憩開始時刻と休憩終了時刻が同一の場合', () => {
  it('breakStartTimeとbreakEndTimeが同一時刻の場合、InvalidBreakTimeConfigErrorを発生させること', () => {
    const input = {
      startDateTime: '2024-01-15T09:00:00Z',
      endDateTime: '2024-01-15T18:00:00Z',
      breakStartTime: '12:00',
      breakEndTime: '12:00',
      applyBreakAdjustment: true,
    };

    expect(() => {
      calculateWorkHours(input);
    }).toThrow(expect.objectContaining({
      name: 'InvalidBreakTimeConfigError',
      message: '休憩開始時刻は休憩終了時刻より前である必要があります。',
    }));
  });
});