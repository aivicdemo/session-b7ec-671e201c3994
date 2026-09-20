import { listProficienciesByCondition } from '../../src/logic/data-persistence';

describe('SCEN-655: 職務区分で絞り込んだ習熟度データを取得できる', () => {
  const proficiencyRecords = [
    {
      proficiencyId: 'prof-001',
      workerId: 'worker-001',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-002',
      workerId: 'worker-002',
      jobType: 'ピッキング',
      proficiencyLevel: '上級',
      evaluationDate: '2024-01-14T09:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-14T09:00:00Z',
      updatedAt: '2024-01-14T09:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-003',
      workerId: 'worker-003',
      jobType: 'ピッキング',
      proficiencyLevel: '初級',
      evaluationDate: '2024-01-13T08:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-13T08:00:00Z',
      updatedAt: '2024-01-13T08:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-004',
      workerId: 'worker-004',
      jobType: 'ピッキング',
      proficiencyLevel: 'エキスパート',
      evaluationDate: '2024-01-12T07:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-12T07:00:00Z',
      updatedAt: '2024-01-12T07:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-005',
      workerId: 'worker-005',
      jobType: 'ピッキング',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-11T06:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-11T06:00:00Z',
      updatedAt: '2024-01-11T06:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-006',
      workerId: 'worker-006',
      jobType: '検査',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-10T05:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-10T05:00:00Z',
      updatedAt: '2024-01-10T05:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-007',
      workerId: 'worker-007',
      jobType: '梱包',
      proficiencyLevel: '上級',
      evaluationDate: '2024-01-09T04:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-09T04:00:00Z',
      updatedAt: '2024-01-09T04:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-008',
      workerId: 'worker-008',
      jobType: '搬送',
      proficiencyLevel: '初級',
      evaluationDate: '2024-01-08T03:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-08T03:00:00Z',
      updatedAt: '2024-01-08T03:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-009',
      workerId: 'worker-009',
      jobType: '品質検査',
      proficiencyLevel: 'エキスパート',
      evaluationDate: '2024-01-07T02:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-07T02:00:00Z',
      updatedAt: '2024-01-07T02:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-010',
      workerId: 'worker-010',
      jobType: '仕分け',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-06T01:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-06T01:00:00Z',
      updatedAt: '2024-01-06T01:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-011',
      workerId: 'worker-011',
      jobType: '組立',
      proficiencyLevel: '上級',
      evaluationDate: '2024-01-05T00:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-012',
      workerId: 'worker-012',
      jobType: '張り付け',
      proficiencyLevel: '初級',
      evaluationDate: '2024-01-04T23:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-04T23:00:00Z',
      updatedAt: '2024-01-04T23:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-013',
      workerId: 'worker-013',
      jobType: '調整',
      proficiencyLevel: '中級',
      evaluationDate: '2024-01-03T22:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-03T22:00:00Z',
      updatedAt: '2024-01-03T22:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
    {
      proficiencyId: 'prof-014',
      workerId: 'worker-014',
      jobType: 'テスト',
      proficiencyLevel: 'エキスパート',
      evaluationDate: '2024-01-02T21:00:00Z',
      evaluatedBy: 'user-001',
      remarks: null,
      createdAt: '2024-01-02T21:00:00Z',
      updatedAt: '2024-01-02T21:00:00Z',
      createdBy: 'user-001',
      updatedBy: null,
    },
  ];

  beforeAll(async () => {
    // テスト用の習熟度データをデータベースに準備
    for (const record of proficiencyRecords) {
      await (global as any).__db__.insertProficiency(record);
    }
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    for (const record of proficiencyRecords) {
      await (global as any).__db__.deleteProficiency(record.proficiencyId);
    }
  });

  it('jobTypes パラメータで指定された職務区分に合致する習熟度レコードのみを返す', async () => {
    // Act: listProficienciesByCondition を jobTypes=['ピッキング'] で呼び出す
    const result = await listProficienciesByCondition({
      jobTypes: ['ピッキング'],
      proficiencyIds: undefined,
      workerIds: undefined,
      proficiencyLevels: undefined,
      evaluatedFromDate: undefined,
      evaluatedToDate: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.proficiencies).toBeDefined();
    expect(Array.isArray(result.proficiencies)).toBe(true);
    expect(result.proficiencies.length).toBe(5);

    // すべての返却されたレコードが 'ピッキング' 職務区分であることを確認
    result.proficiencies.forEach((proficiency) => {
      expect(proficiency.jobType).toBe('ピッキング');
    });

    // totalCount が 5 であることを確認
    expect(result.totalCount).toBe(5);

    // ページネーション情報が null/undefined であることを確認
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();

    // retrievedAt が ISO 8601 形式の日時であることを確認
    expect(result.retrievedAt).toBeDefined();
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe('Invalid Date');

    // 期待される proficiencyIds がすべて含まれていることを確認
    const expectedProficiencyIds = ['prof-001', 'prof-002', 'prof-003', 'prof-004', 'prof-005'];
    const returnedProficiencyIds = result.proficiencies.map((p) => p.proficiencyId);
    expectedProficiencyIds.forEach((id) => {
      expect(returnedProficiencyIds).toContain(id);
    });

    // その他の職務区分のレコード（prof-006 から prof-014）が含まれていないことを確認
    const unexpectedProficiencyIds = [
      'prof-006',
      'prof-007',
      'prof-008',
      'prof-009',
      'prof-010',
      'prof-011',
      'prof-012',
      'prof-013',
      'prof-014',
    ];
    unexpectedProficiencyIds.forEach((id) => {
      expect(returnedProficiencyIds).not.toContain(id);
    });
  });
});