import { listWorkInstructionReceptionHistoryByCondition } from "../../src/logic/data-persistence";
import { ListWorkInstructionReceptionHistoryByConditionInput, ListWorkInstructionReceptionHistoryByConditionOutput } from "../../src/logic/data-persistence";

describe("SCEN-1061: 検索条件に合致するレコードが存在しない場合、空の一覧と総件数0が返される", () => {
  it("should return empty list with totalCount 0 when no records match the search conditions", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBeNull();
    expect(result.pageSize).toBeNull();
    expect(result.retrievedAt).toBeDefined();
    expect(typeof result.retrievedAt).toBe("string");
    // 検証：ISO 8601形式であることを確認
    expect(() => new Date(result.retrievedAt)).not.toThrow();
  });

  it("should return empty list when specific search conditions match no records", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: ["non-existent-id-12345"],
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.retrievedAt).toBeDefined();
  });

  it("should return empty list when filtering by non-existent worker ID", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: ["worker-id-that-does-not-exist"],
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should return empty list when date range has no matching records", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: "2099-01-01T00:00:00Z",
      receptionDateToDateTime: "2099-12-31T23:59:59Z",
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should return empty list when filtering by non-existent reception status", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: ["status-that-does-not-exist"],
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should return proper pagination fields when no results with pagination parameters", async () => {
    const input: ListWorkInstructionReceptionHistoryByConditionInput = {
      receptionHistoryIds: null,
      workInstructionIds: null,
      workerIds: null,
      receptionStatuses: null,
      deliveryMethods: null,
      receptionDateFromDateTime: null,
      receptionDateToDateTime: null,
      confirmationDateFromDateTime: null,
      confirmationDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: 1,
      pageSize: 50,
    };

    const result: ListWorkInstructionReceptionHistoryByConditionOutput =
      await listWorkInstructionReceptionHistoryByCondition(input);

    expect(result.receptionHistories).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.retrievedAt).toBeDefined();
  });
});