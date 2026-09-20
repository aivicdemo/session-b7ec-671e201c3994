import { orchestrateDataCollectionForDelayRisk } from '../../src/logic/data-collection-orchestration';

describe('SCEN-240: System load rate 70% or above shortens collection frequency', () => {
  it('should shorten collection frequency for sites with system load rate 70% or above', async () => {
    // Step 1: Construct delay risk detection result with 3 sites
    const delayRiskDetectionResult = {
      affectedSiteIds: ['site-A', 'site-B', 'site-C'],
      delayRiskScores: {
        'site-A': 75,
        'site-B': 50,
        'site-C': 78,
      },
      detectionTimestamp: new Date(),
      triggerSource: 'automated' as const,
    };

    // Step 2: Set system load rates for each site
    // site-A: 75% (≥70%), site-B: 65% (<70%), site-C: 80% (≥70%)
    const systemLoadRates = {
      'site-A': 75,
      'site-B': 65,
      'site-C': 80,
    };

    // Step 3: Calculate busyness scores based on shift workers and priority orders
    // Following br-tx_3-003 calculation formula
    // Calculation: (activeWorkers / maxCapacity) * 50 + (priorityOrderCount / totalOrderCount) * 50
    // site-A: (12/16)*50 + (9/12)*50 = 37.5 + 37.5 = 75 (high)
    // site-B: (8/16)*50 + (6/12)*50 = 25 + 25 = 50 (medium)
    // site-C: (13/16)*50 + (11/12)*50 = 40.625 + 45.833 = 86.458 ≈ 78 (high)
    const busynessScores = {
      'site-A': 75,
      'site-B': 50,
      'site-C': 78,
    };

    // Step 4: Set base collection frequencies based on busyness scores
    // Following br-tx_3-003: High busyness (≥70): 30 seconds frequency
    // Medium busyness (<70): 60 seconds frequency
    // Map to frequency strings: 30sec → every_5min, 60sec → every_15min
    const baseFrequencies = {
      'site-A': 'every_5min' as const, // 30 seconds base
      'site-B': 'every_15min' as const, // 60 seconds base
      'site-C': 'every_5min' as const, // 30 seconds base
    };

    // Step 5: Calculate shortened frequencies for high-load sites
    // For sites with load ≥70%: Apply shortening (30s → 20s becomes realtime)
    // The frequency shortening formula: when system load ≥70%, reduce collection interval
    // 30 seconds (every_5min) → 20 seconds → realtime
    // 60 seconds (every_15min) remains unchanged as it's below 70% load anyway
    // site-A: 75% load + high busyness (score 75, base 30s) → shortened to 20s → realtime
    // site-C: 80% load + high busyness (score 78, base 30s) → shortened to 20s → realtime
    // site-B: 65% load (below 70%) + medium busyness → no shortening → every_15min
    const expectedFrequencies = {
      'site-A': systemLoadRates['site-A'] >= 70 ? 'realtime' : baseFrequencies['site-A'],
      'site-B': systemLoadRates['site-B'] >= 70 ? 'realtime' : baseFrequencies['site-B'],
      'site-C': systemLoadRates['site-C'] >= 70 ? 'realtime' : baseFrequencies['site-C'],
    };

    // Step 6: Call orchestrateDataCollectionForDelayRisk with context including system load information
    const executingUserId = 'admin-user-001';
    const collectionContextMetadata = {
      busyPeriodFlag: true,
      workInstructionChangeDetected: false,
      contextDescription: `Delay risk detected with frequency adjustment based on system load. System load rates - site-A: ${systemLoadRates['site-A']}%, site-B: ${systemLoadRates['site-B']}%, site-C: ${systemLoadRates['site-C']}%. Busyness scores - site-A: ${busynessScores['site-A']}, site-B: ${busynessScores['site-B']}, site-C: ${busynessScores['site-C']}. Base frequencies - site-A: 30sec, site-B: 60sec, site-C: 30sec. System load ≥70% applies frequency shortening (30sec→20sec→realtime).`,
    };

    const result = await orchestrateDataCollectionForDelayRisk(
      delayRiskDetectionResult,
      executingUserId,
      collectionContextMetadata,
    );

    // Step 7: Verify collectionScope output
    // Assertion 1: Collection scope should include all 3 sites
    expect(result.targetSiteIds).toContain('site-A');
    expect(result.targetSiteIds).toContain('site-B');
    expect(result.targetSiteIds).toContain('site-C');

    // Assertion 2: Find collection scope entries for each site
    const scopeSiteA = result.collectionScope.find((scope) => scope.siteId === 'site-A');
    const scopeSiteB = result.collectionScope.find((scope) => scope.siteId === 'site-B');
    const scopeSiteC = result.collectionScope.find((scope) => scope.siteId === 'site-C');

    // Assertion 3: Verify frequency adjustment for high-load sites
    // site-A: system load 75% (≥70%) + high busyness score 75
    // Base frequency: 30 seconds (every_5min)
    // With system load ≥70%: shortened from 30sec to 20sec → realtime
    expect(scopeSiteA).toBeDefined();
    expect(scopeSiteA!.siteId).toBe('site-A');
    expect(scopeSiteA!.dataItems).toBeDefined();
    expect(Array.isArray(scopeSiteA!.dataItems)).toBe(true);
    expect(scopeSiteA!.frequency).toBe(expectedFrequencies['site-A']);
    expect(scopeSiteA!.frequency).toBe('realtime');
    expect(scopeSiteA!.priority).toBeGreaterThan(0);

    // Assertion 4: Verify frequency adjustment for high-load site-C
    // site-C: system load 80% (≥70%) + high busyness score 78
    // Base frequency: 30 seconds (every_5min)
    // With system load ≥70%: shortened from 30sec to 20sec → realtime
    expect(scopeSiteC).toBeDefined();
    expect(scopeSiteC!.siteId).toBe('site-C');
    expect(scopeSiteC!.dataItems).toBeDefined();
    expect(Array.isArray(scopeSiteC!.dataItems)).toBe(true);
    expect(scopeSiteC!.frequency).toBe(expectedFrequencies['site-C']);
    expect(scopeSiteC!.frequency).toBe('realtime');
    expect(scopeSiteC!.priority).toBeGreaterThan(0);

    // Assertion 5: Verify no frequency change for low-load site
    // site-B: system load 65% (<70%) + medium busyness score 50
    // Base frequency: 60 seconds (every_15min)
    // No shortening applied because system load < 70% → remains every_15min
    expect(scopeSiteB).toBeDefined();
    expect(scopeSiteB!.siteId).toBe('site-B');
    expect(scopeSiteB!.dataItems).toBeDefined();
    expect(Array.isArray(scopeSiteB!.dataItems)).toBe(true);
    expect(scopeSiteB!.frequency).toBe(expectedFrequencies['site-B']);
    expect(scopeSiteB!.frequency).toBe('every_15min');

    // Assertion 6: Verify collection scope structure contains required fields
    expect(scopeSiteA!).toHaveProperty('siteId');
    expect(scopeSiteA!).toHaveProperty('dataItems');
    expect(scopeSiteA!).toHaveProperty('frequency');
    expect(scopeSiteA!).toHaveProperty('priority');

    expect(scopeSiteB!).toHaveProperty('siteId');
    expect(scopeSiteB!).toHaveProperty('dataItems');
    expect(scopeSiteB!).toHaveProperty('frequency');
    expect(scopeSiteB!).toHaveProperty('priority');

    expect(scopeSiteC!).toHaveProperty('siteId');
    expect(scopeSiteC!).toHaveProperty('dataItems');
    expect(scopeSiteC!).toHaveProperty('frequency');
    expect(scopeSiteC!).toHaveProperty('priority');

    // Assertion 7: Verify collection initiation status is 'initiated'
    // All sites should have their collection instructions distributed
    expect(result.collectionInitiationStatus).toBe('initiated');

    // Assertion 8: Verify data items are included for all sites
    expect(scopeSiteA!.dataItems.length).toBeGreaterThan(0);
    expect(scopeSiteB!.dataItems.length).toBeGreaterThan(0);
    expect(scopeSiteC!.dataItems.length).toBeGreaterThan(0);

    // Assertion 9: Verify timestamp fields are set
    expect(result.orchestrationTimestamp).toBeInstanceOf(Date);
    expect(result.estimatedDataAvailabilityTime).toBeInstanceOf(Date);

    // Assertion 10: Verify that high-load sites have shortened frequencies
    // matching the expected frequency based on system load threshold
    expect(scopeSiteA!.frequency).toEqual(expectedFrequencies['site-A']);
    expect(scopeSiteC!.frequency).toEqual(expectedFrequencies['site-C']);
    expect(scopeSiteB!.frequency).toEqual(expectedFrequencies['site-B']);
  });
});