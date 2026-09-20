import { getFacilityById } from '../../src/logic/data-persistence';

describe('SCEN-510: getFacilityById', () => {
  it('存在する拠点IDで検索すると拠点マスタの全項目が返される', async () => {
    // テスト対象の getFacilityById 関数を、有効な拠点IDを入力として呼び出す
    const facilityId = 'FAC-001';
    const result = await getFacilityById({ facilityId });

    // 戻り値には拠点マスタの全12項目が含まれること
    expect(result).toBeDefined();
    expect(result).toHaveProperty('facilityId');
    expect(result).toHaveProperty('facilityName');
    expect(result).toHaveProperty('facilityCode');
    expect(result).toHaveProperty('address');
    expect(result).toHaveProperty('maxCapacity');
    expect(result).toHaveProperty('currentCapacity');
    expect(result).toHaveProperty('operatingStatus');
    expect(result).toHaveProperty('responsiblePersonName');
    expect(result).toHaveProperty('contactInfo');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('createdBy');
    expect(result).toHaveProperty('updatedBy');

    // 具体的には、facilityId='FAC-001'、facilityName='東京物流センター'等である
    expect(result.facilityId).toBe('FAC-001');
    expect(result.facilityName).toBe('東京物流センター');
    expect(result.facilityCode).toBe('TYO-01');
    expect(result.address).toBe('東京都江東区');
    expect(result.maxCapacity).toBe(150);
    expect(result.currentCapacity).toBe(120);
    expect(result.operatingStatus).toBe('稼働中');
    expect(result.responsiblePersonName).toBe('田中太郎');
    expect(result.contactInfo).toBe('03-xxxx-xxxx');

    // createdAt、updatedAtはISO 8601形式であること
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.createdAt).toBe('2024-01-15T09:30:00Z');
    expect(result.updatedAt).toBe('2024-01-20T14:45:00Z');

    // createdByとupdatedByの値を確認
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toEqual(expect.stringMatching(/^user-\d+$|null/));
  });
});