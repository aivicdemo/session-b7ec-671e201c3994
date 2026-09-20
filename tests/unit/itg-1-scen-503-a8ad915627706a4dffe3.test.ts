import { saveFacility } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-503: 現在配置人員数が最大収容人員数を超える場合、収容人員エラーが発生する', () => {
  beforeEach(() => {
    jest.spyOn(dataPersistence, 'validateInputFormat' as any).mockReturnValue(true);
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maxCapacity より currentCapacity が大きい場合、InvalidCapacityError を発生させ、データベースに永続化しない', async () => {
    const input = {
      facilityId: null,
      facilityName: '東京拠点',
      facilityCode: 'TKY-001',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 60,
      operatingStatus: 'active',
      responsiblePersonName: '田中太郎',
      contactInfo: '090-1234-5678',
      createdBy: 'user-001',
    };

    let errorThrown: Error | null = null;
    let errorType: string = '';

    try {
      await saveFacility(input);
    } catch (error) {
      errorThrown = error as Error;
      errorType = (error as any).constructor.name;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorType).toBe('InvalidCapacityError');
    expect(errorThrown?.message).toBe(
      '最大収容人員数は現在配置人員数以上である必要があります。'
    );
  });
});