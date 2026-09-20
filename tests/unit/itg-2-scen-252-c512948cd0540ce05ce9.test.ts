import { orchestrateDataCollectionForDelayRisk } from "../../src/logic/data-collection-orchestration";

describe("SCEN-252: 最初の集約データが利用可能になる予定時刻が計算される", () => {
  it("should calculate estimatedDataAvailabilityTime based on the shortest collection frequency in collectionScope", async () => {
    const orchestrationTimestamp = new Date("2024-01-15T10:00:00Z");
    const delayRiskDetectionResult = {
      affectedSiteIds: ["SITE001", "SITE002", "SITE003"],
      delayRiskScores: {
        SITE001: 85,
        SITE002: 72,
        SITE003: 60,
      },
      detectionTimestamp: orchestrationTimestamp,
      triggerSource: "automated" as const,
    };

    const executingUserId = "USER-CENTER-001";

    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: "高優先度受注の遅延リスク検知",
    };

    const output = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    });

    expect(output.estimatedDataAvailabilityTime).toBeDefined();
    expect(output.estimatedDataAvailabilityTime instanceof Date).toBe(true);
    expect(output.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      orchestrationTimestamp.getTime()
    );

    const collectionScope = output.collectionScope;
    expect(collectionScope).toBeDefined();
    expect(collectionScope.length).toBeGreaterThan(0);

    const frequencyToMs: Record<
      "realtime" | "every_5min" | "every_15min" | "hourly",
      number
    > = {
      realtime: 5 * 1000,
      every_5min: 5 * 60 * 1000,
      every_15min: 15 * 60 * 1000,
      hourly: 60 * 60 * 1000,
    };

    const shortestFrequency = collectionScope.reduce(
      (min: "realtime" | "every_5min" | "every_15min" | "hourly", scope) => {
        if (frequencyToMs[scope.frequency] < frequencyToMs[min]) {
          return scope.frequency;
        }
        return min;
      },
      "hourly"
    );

    const expectedMaxTime = new Date(
      orchestrationTimestamp.getTime() + frequencyToMs[shortestFrequency]
    );

    expect(output.estimatedDataAvailabilityTime.getTime()).toBeLessThanOrEqual(
      expectedMaxTime.getTime()
    );

    if (shortestFrequency === "realtime") {
      expect(
        output.estimatedDataAvailabilityTime.getTime() -
          orchestrationTimestamp.getTime()
      ).toBeLessThanOrEqual(5 * 1000);
    } else if (shortestFrequency === "every_5min") {
      expect(
        output.estimatedDataAvailabilityTime.getTime() -
          orchestrationTimestamp.getTime()
      ).toBeLessThanOrEqual(5 * 60 * 1000);
    } else if (shortestFrequency === "every_15min") {
      expect(
        output.estimatedDataAvailabilityTime.getTime() -
          orchestrationTimestamp.getTime()
      ).toBeLessThanOrEqual(15 * 60 * 1000);
    } else if (shortestFrequency === "hourly") {
      expect(
        output.estimatedDataAvailabilityTime.getTime() -
          orchestrationTimestamp.getTime()
      ).toBeLessThanOrEqual(60 * 60 * 1000);
    }
  });

  it("should return estimatedDataAvailabilityTime in ISO8601 Date format", async () => {
    const orchestrationTimestamp = new Date("2024-01-15T10:00:00Z");

    const output = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult: {
        affectedSiteIds: ["SITE001"],
        delayRiskScores: { SITE001: 85 },
        detectionTimestamp: orchestrationTimestamp,
        triggerSource: "automated",
      },
      executingUserId: "USER-CENTER-001",
      collectionContextMetadata: {
        busyPeriodFlag: true,
        workInstructionChangeDetected: false,
        contextDescription: "test",
      },
    });

    expect(output.estimatedDataAvailabilityTime).toBeInstanceOf(Date);
    expect(
      output.estimatedDataAvailabilityTime.toISOString()
    ).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it("should set estimatedDataAvailabilityTime later than orchestrationTimestamp", async () => {
    const orchestrationTimestamp = new Date("2024-01-15T10:00:00Z");

    const output = await orchestrateDataCollectionForDelayRisk({
      delayRiskDetectionResult: {
        affectedSiteIds: ["SITE001", "SITE002"],
        delayRiskScores: { SITE001: 90, SITE002: 75 },
        detectionTimestamp: orchestrationTimestamp,
        triggerSource: "automated",
      },
      executingUserId: "USER-CENTER-001",
      collectionContextMetadata: {
        busyPeriodFlag: false,
        workInstructionChangeDetected: true,
        contextDescription: "work instruction changed",
      },
    });

    expect(output.orchestrationTimestamp).toBeDefined();
    expect(output.estimatedDataAvailabilityTime.getTime()).toBeGreaterThan(
      output.orchestrationTimestamp.getTime()
    );
  });
});