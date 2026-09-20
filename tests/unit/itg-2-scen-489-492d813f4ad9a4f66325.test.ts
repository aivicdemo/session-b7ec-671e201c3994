import { findProductivityDataBySiteAndPeriod } from '../../src/logic/persistence-layer';
import * as validationModule from '../../src/logic/validation';
import * as permissionModule from '../../src/logic/permission';
import * as dbModule from '../../src/logic/database';

jest.mock('../../src/logic/validation');
jest.mock('../../src/logic/permission');
jest.mock('../../src/logic/database');

describe('SCEN-489: findProductivityDataBySiteAndPeriod - edge case with no matching records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty productivityRecords with found=false when no records match the search criteria', async () => {
    const siteId = 'site-12345';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'user-67890';

    // Step 1: checkResourceAccessPermissionをスタブ化し、アクセス権を許可
    (permissionModule.checkResourceAccessPermission as jest.Mock).mockResolvedValue(true);

    // Step 2: validateRequiredFieldsをスタブ化し、検証成功を返す
    (validationModule.validateRequiredFields as jest.Mock).mockReturnValue({ valid: true });

    // Step 3: validateFieldValueRangeをスタブ化し、日付範囲検証成功を返す
    (validationModule.validateFieldValueRange as jest.Mock).mockReturnValue({ valid: true });

    // Step 4: データベースをスタブ化し、指定されたsiteIdと期間に該当するレコードが0件
    (dbModule.queryProductivityRecords as jest.Mock).mockResolvedValue([]);

    // Step 5: findProductivityDataBySiteAndPeriodを呼び出す
    const result = await findProductivityDataBySiteAndPeriod({
      siteId,
      startDate,
      endDate,
      requestingUserId,
    });

    // Step 6: 戻り値を検証する
    expect(result.productivityRecords).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.found).toBe(false);
    expect(result.siteId).toBe(siteId);
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);

    // モック関数が正しく呼び出されたことを検証
    expect(permissionModule.checkResourceAccessPermission).toHaveBeenCalledWith(
      requestingUserId,
      siteId
    );
    expect(validationModule.validateRequiredFields).toHaveBeenCalledWith({
      siteId,
      startDate,
      endDate,
      requestingUserId,
    });
    expect(validationModule.validateFieldValueRange).toHaveBeenCalledWith(startDate, endDate);
  });
});