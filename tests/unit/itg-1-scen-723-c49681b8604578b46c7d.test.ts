import { jest } from '@jest/globals';
import { listWorkResultsByCondition, ListWorkResultsByConditionInput, ListWorkResultsByConditionOutput, GetWorkResultByIdOutput } from '../../src/logic/data-persistence';

// モック設定をファイル最上部で実行
jest.mock('../../src/logic/data-persistence', () => {
  const actual = jest.requireActual('../../src/logic/data-persistence');
  return {
    ...actual,
    validateDateTimeRange: jest.fn().mockResolvedValue(undefined),
    validateNumericQuantity: jest.fn().mockResolvedValue(undefined),
  };
});

describe('SCEN-723: 作業実績データの検索と取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された検索条件に合致する作業実績データの一覧を取得し、進捗監視・生産性分析・人員配置最適化の基礎データとして提供する', async () => {
    // 準備: 入力パラメータを設定
    const input: ListWorkResultsByConditionInput = {
      workInstructionIds: ['WI-001', 'WI-002'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    // 実行
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    // 検証: 出力型の構造を確認
    expect(result).toBeDefined();
    expect(typeof result === 'object').toBe(true);
    
    // workResults フィールドが配列であることを確認
    expect(Array.isArray(result.workResults)).toBe(true);
    expect(result.workResults).toBeDefined();

    // workResults 配列のすべての要素が workInstructionIds に合致することを確認
    // 仕様: 「その配列に含まれるすべての要素が workInstructionIds パラメータの ['WI-001', 'WI-002'] に合致することを確認する」
    result.workResults.forEach((record: GetWorkResultByIdOutput) => {
      expect(record.workInstructionId).toBeDefined();
      expect(['WI-001', 'WI-002']).toContain(record.workInstructionId);
      // 入力条件に完全に合致することを確認
      expect(['WI-001', 'WI-002'].includes(record.workInstructionId)).toBe(true);
    });

    // totalCount フィールドが 0 以上の整数であることを確認
    expect(typeof result.totalCount).toBe('number');
    expect(Number.isInteger(result.totalCount)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // pageNumber が指定値またはデフォルト値であることを確認
    expect(result.pageNumber).toBeDefined();
    // 入力で pageNumber が undefined の場合、デフォルト値 1 が返却される
    if (input.pageNumber === undefined) {
      expect(result.pageNumber).toBe(1);
    } else {
      expect(result.pageNumber).toBe(input.pageNumber);
    }

    // pageSize が指定値またはデフォルト値であることを確認
    expect(result.pageSize).toBeDefined();
    // 入力で pageSize が undefined の場合、デフォルト値 50 が返却される
    if (input.pageSize === undefined) {
      expect(result.pageSize).toBe(50);
    } else {
      expect(result.pageSize).toBe(input.pageSize);
    }

    // retrievedAt フィールドが ISO 8601 形式の日時文字列であることを確認
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe('string');
    
    // ISO 8601 形式の正合性を確認
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(result.retrievedAt).toMatch(isoDateRegex);
    
    // 有効な日時であることを確認
    const retrievedAtDate = new Date(result.retrievedAt);
    expect(retrievedAtDate.getTime()).toBeGreaterThan(0);
    expect(isNaN(retrievedAtDate.getTime())).toBe(false);

    // 現在日時（またはその近辺）であることを確認
    const now = Date.now();
    const retrievedAtTime = retrievedAtDate.getTime();
    const allowableTimeDifferenceMs = 60000; // 60秒の許容差
    expect(Math.abs(now - retrievedAtTime)).toBeLessThanOrEqual(allowableTimeDifferenceMs);
  });

  it('pageNumber と pageSize が指定値として正しく返却されることを確認する', async () => {
    // 準備: pageNumber と pageSize を明示的に指定
    const input: ListWorkResultsByConditionInput = {
      workInstructionIds: ['WI-001'],
      workerIds: undefined,
      facilityIds: undefined,
      teamIds: undefined,
      workStatuses: undefined,
      minActualQuantity: undefined,
      maxActualQuantity: undefined,
      minDefectCount: undefined,
      maxDefectCount: undefined,
      actualStartFromDateTime: undefined,
      actualStartToDateTime: undefined,
      actualEndFromDateTime: undefined,
      actualEndToDateTime: undefined,
      createdFromDate: undefined,
      createdToDate: undefined,
      updatedFromDate: undefined,
      updatedToDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: 2,
      pageSize: 25,
    };

    // 実行
    const result: ListWorkResultsByConditionOutput = await listWorkResultsByCondition(input);

    // 検証: 指定値が正しく返却されることを確認
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(25);

    // retrievedAt が現在日時であることを確認
    const now = Date.now();
    const retrievedAtDate = new Date(result.retrievedAt);
    const allowableTimeDifferenceMs = 60000; // 60秒の許容差
    expect(Math.abs(now - retrievedAtDate.getTime())).toBeLessThanOrEqual(allowableTimeDifferenceMs);
  });
});