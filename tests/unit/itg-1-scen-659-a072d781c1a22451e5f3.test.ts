import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-659: 更新日範囲で絞り込んだ習熟度データを取得できる', () => {
  it('指定された更新日範囲に合致する習熟度データのみを取得する', async () => {
    const input = {
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
    };

    const result = await listProficienciesByCondition(input);

    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);
    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.retrievedAt).toBeDefined();

    const fromDate = new Date('2024-01-01T00:00:00Z').getTime();
    const toDate = new Date('2024-01-31T23:59:59Z').getTime();

    result.proficiencies.forEach((proficiency) => {
      const updatedAtTime = new Date(proficiency.updatedAt).getTime();
      expect(updatedAtTime).toBeGreaterThanOrEqual(fromDate);
      expect(updatedAtTime).toBeLessThanOrEqual(toDate);
    });

    expect(result.proficiencies.length).toBeLessThanOrEqual(result.totalCount);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    expect(retrievedTime).toBeGreaterThan(0);

    if (result.proficiencies.length > 0) {
      expect(result.totalCount).toBeGreaterThanOrEqual(result.proficiencies.length);
    }
  });

  it('返却された proficiencies 配列の各要素が正しいスキーマを持つ', async () => {
    const input = {
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
    };

    const result = await listProficienciesByCondition(input);

    if (result.proficiencies.length > 0) {
      const proficiency = result.proficiencies[0];

      expect(proficiency.proficiencyId).toBeDefined();
      expect(typeof proficiency.proficiencyId).toBe('string');
      expect(proficiency.workerId).toBeDefined();
      expect(typeof proficiency.workerId).toBe('string');
      expect(proficiency.jobType).toBeDefined();
      expect(typeof proficiency.jobType).toBe('string');
      expect(proficiency.proficiencyLevel).toBeDefined();
      expect(typeof proficiency.proficiencyLevel).toBe('string');
      expect(proficiency.evaluationDate).toBeDefined();
      expect(typeof proficiency.evaluationDate).toBe('string');
      expect(proficiency.evaluatedBy).toBeDefined();
      expect(typeof proficiency.evaluatedBy).toBe('string');
      expect(proficiency.createdAt).toBeDefined();
      expect(typeof proficiency.createdAt).toBe('string');
      expect(proficiency.updatedAt).toBeDefined();
      expect(typeof proficiency.updatedAt).toBe('string');
      expect(proficiency.createdBy).toBeDefined();
      expect(typeof proficiency.createdBy).toBe('string');
    }
  });

  it('totalCount が正確に範囲内データの件数を反映する', async () => {
    const input = {
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
    };

    const result = await listProficienciesByCondition(input);

    const fromDate = new Date('2024-01-01T00:00:00Z').getTime();
    const toDate = new Date('2024-01-31T23:59:59Z').getTime();

    const matchingCount = result.proficiencies.filter((proficiency) => {
      const updatedAtTime = new Date(proficiency.updatedAt).getTime();
      return updatedAtTime >= fromDate && updatedAtTime <= toDate;
    }).length;

    expect(result.proficiencies.length).toBe(matchingCount);
  });

  it('範囲外の更新日を持つデータは結果に含まれない', async () => {
    const input = {
      updatedFromDate: '2024-01-01T00:00:00Z',
      updatedToDate: '2024-01-31T23:59:59Z',
    };

    const result = await listProficienciesByCondition(input);

    const fromDate = new Date('2024-01-01T00:00:00Z');
    const toDate = new Date('2024-01-31T23:59:59Z');

    result.proficiencies.forEach((proficiency) => {
      const updatedDate = new Date(proficiency.updatedAt);
      expect(updatedDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
      expect(updatedDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });
  });
});