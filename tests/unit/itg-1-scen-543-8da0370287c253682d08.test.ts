import { listFacilitiesByCondition } from "../../src/logic/data-persistence";

describe("SCEN-543: validateDateTimeRangeを呼び出して日時範囲を検証する", () => {
  it("開始日時が終了日時より後の場合、InvalidSearchConditionErrorを発生させる", async () => {
    const input = {
      facilityIds: null,
      facilityCodes: null,
      facilityNameKeyword: null,
      operatingStatuses: null,
      minCapacity: null,
      maxCapacity: null,
      createdFromDate: "2024-01-15T10:00:00Z",
      createdToDate: "2024-01-10T10:00:00Z",
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    try {
      await listFacilitiesByCondition(input);
      fail("InvalidSearchConditionErrorが発生するはずです");
    } catch (error: any) {
      expect(error.name).toBe("InvalidSearchConditionError");
      expect(error.message).toBe(
        "検索条件が不正です。日時範囲と数値範囲を確認してください。"
      );
    }
  });
});