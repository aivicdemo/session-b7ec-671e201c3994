import { findWorkersByClassificationAndSite } from '../../src/logic/persistence-layer';
import { jest } from '@jest/globals';

describe('SCEN-445: 指定された職務分類と拠点に該当する作業者レコードを検索', () => {
  it('指定された職務分類が作業タイプマスタに存在しない場合、InvalidClassificationError が発生する', async () => {
    const input = {
      jobType: 'INVALID_JOB_TYPE',
      siteId: 'SITE_001',
      operatingStatusFilter: undefined,
      requestingUserId: 'USER_001',
    };

    let errorThrown = false;
    let thrownError: any = null;

    try {
      await findWorkersByClassificationAndSite(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error;
    }

    expect(errorThrown).toBe(true);
    expect(thrownError).not.toBeNull();

    expect(thrownError.name).toBe('InvalidClassificationError');
    expect(thrownError.message).toBe('指定された職務分類は存在しません。');

    expect(Object.prototype.hasOwnProperty.call(thrownError, 'workers')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'totalCount')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(thrownError, 'found')).toBe(false);
  });
});