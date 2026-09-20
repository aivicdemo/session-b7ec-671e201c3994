import { listProgressDataByCondition } from "../../src/logic/data-persistence";

describe("SCEN-906: 進捗日の範囲で絞り込んだ結果を取得できる", () => {
  it("should retrieve progress data within the specified date range", async () => {
    // 準備: 進捗日の検索範囲を指定した入力を準備する
    const input = {
      progressDateFrom: "2024-01-01",
      progressDateTo: "2024-01-31",
    };

    // 実行: listProgressDataByCondition操作を、準備した入力値で呼び出す
    const output = await listProgressDataByCondition(input);

    // 検証1: 返却されたprogressDataListの各要素について、progressDateフィールド値が範囲内であることを確認する
    expect(output.progressDataList).toBeDefined();
    expect(Array.isArray(output.progressDataList)).toBe(true);

    output.progressDataList.forEach((progressData) => {
      const progressDate = new Date(progressData.progressDate);
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-01-31T23:59:59.999Z");

      expect(progressDate.getTime()).toBeGreaterThanOrEqual(
        fromDate.getTime()
      );
      expect(progressDate.getTime()).toBeLessThanOrEqual(toDate.getTime());
    });

    // 検証2: totalCountが条件に合致するデータの正確な件数であることを確認する
    expect(output.totalCount).toEqual(output.progressDataList.length);
    expect(output.totalCount).toBeGreaterThanOrEqual(0);

    // 検証3: retrievedAtがISO 8601形式の有効な日時文字列であることを確認する
    expect(output.retrievedAt).toBeDefined();
    expect(typeof output.retrievedAt).toBe("string");
    const retrievedAtDate = new Date(output.retrievedAt);
    expect(retrievedAtDate.toString()).not.toBe("Invalid Date");
    expect(output.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});