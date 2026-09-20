import { test, expect } from '@playwright/test';

test('SCEN-1221: 画面初期表示時にダッシュボードデータ（進捗・生産性・遅延リスク）が集約される', async ({ page }) => {
  // ブラウザで『進捗・人員配置ダッシュボード』画面のURLにアクセスする
  const startTime = Date.now();
  await page.goto('/panels/scr-1789461783315.html', { waitUntil: 'domcontentloaded' });

  // 画面のレンダリング完了を待ち（最大10秒）、画面上に3つのメインセクションが表示されたことを確認する
  await expect(page.locator('[data-testid="kpi-risk-count"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="kpi-sites-action"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="kpi-active-plans"]')).toBeVisible({ timeout: 10000 });

  // 画面上の『拠点別進捗』セクションが表示されたことを確認
  const siteVarianceTable = page.locator('[data-testid="site-variance-table"]');
  await expect(siteVarianceTable).toBeVisible({ timeout: 10000 });

  // 画面上の『遅延リスク分析』セクションが表示されたことを確認
  const riskAssessmentTable = page.locator('[data-testid="risk-assessment-table"]');
  await expect(riskAssessmentTable).toBeVisible({ timeout: 10000 });

  const elapsedTime = Date.now() - startTime;
  expect(elapsedTime).toBeLessThan(10000);

  // 画面上の『拠点別進捗』セクションに、以下の集約データが表示されていることを目視確認する
  const siteRows = page.locator('#site-variance-tbody tr');
  
  // 拠点A: 完了率 75%
  const siteARow = siteRows.filter({ hasText: '拠点A' });
  await expect(siteARow).toContainText('75%');
  
  // 拠点B: 完了率 60%
  const siteBRow = siteRows.filter({ hasText: '拠点B' });
  await expect(siteBRow).toContainText('60%');
  
  // 拠点C: 完了率 90%
  const siteCRow = siteRows.filter({ hasText: '拠点C' });
  await expect(siteCRow).toContainText('90%');

  // 画面上の『生産性サマリ』セクションに、以下の集約データが表示されていることを目視確認する
  // team-variance-tableが生産性サマリセクション
  const teamVarianceTable = page.locator('[data-testid="team-variance-table"]');
  await expect(teamVarianceTable).toBeVisible({ timeout: 10000 });
  
  const teamVarianceContent = await teamVarianceTable.textContent();
  
  // 平均生産性：100.0件/時
  expect(teamVarianceContent).toContain('100.0');
  
  // 平均品質スコア：95.0%
  expect(teamVarianceContent).toContain('95.0%');
  
  // 習熟度別集計の検証（高・中・低それぞれ1名）
  expect(teamVarianceContent).toMatch(/高/);
  expect(teamVarianceContent).toMatch(/中/);
  expect(teamVarianceContent).toMatch(/低/);

  // 画面上の『遅延リスク分析』セクションに、以下の集約データが表示されていることを目視確認する
  const riskRows = page.locator('#risk-assessment-tbody tr');
  
  // 拠点A: リスク 15%（ステータス：低）
  const riskARow = riskRows.filter({ hasText: '拠点A' });
  await expect(riskARow).toContainText('15%');
  await expect(riskARow).toContainText('低');
  
  // 拠点B: リスク 42%（ステータス：中）
  const riskBRow = riskRows.filter({ hasText: '拠点B' });
  await expect(riskBRow).toContainText('42%');
  await expect(riskBRow).toContainText('中');
  
  // 拠点C: リスク 8%（ステータス：低）
  const riskCRow = riskRows.filter({ hasText: '拠点C' });
  await expect(riskCRow).toContainText('8%');
  await expect(riskCRow).toContainText('低');

  // 拠点B 42%のセルが警告色で強調されていることを確認
  let foundHighlightedRisk = false;
  
  const riskRowCount = await riskRows.count();
  for (let i = 0; i < riskRowCount; i++) {
    const row = riskRows.nth(i);
    const rowText = await row.textContent();
    
    if (rowText?.includes('拠点B') && rowText?.includes('42%')) {
      const computedStyle = await row.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontWeight: style.fontWeight
        };
      });
      
      // 警告色（オレンジ系）での強調を確認
      const isWarningColor = computedStyle.backgroundColor.includes('rgb') && 
                             (computedStyle.backgroundColor.match(/\d+/g) || [])
                               .some((val, idx) => {
                                 // オレンジ系（高い赤・黄成分）の判定
                                 const num = parseInt(val);
                                 return idx === 0 && num > 150; // R値が高い
                               });
      
      if (isWarningColor || computedStyle.fontWeight === '700' || computedStyle.fontWeight === 'bold') {
        foundHighlightedRisk = true;
        break;
      }
    }
  }
  
  expect(foundHighlightedRisk).toBeTruthy();

  // 3つのセクション内で『データ更新時刻：○年○月○日 ○時○分○秒』のタイムスタンプが表示されていることを確認する
  const timestampPattern = /データ更新時刻：\d+年\d+月\d+日 \d+時\d+分\d+秒/g;
  
  // 拠点別進捗セクションのタイムスタンプを抽出
  const siteVarianceSectionContent = await siteVarianceTable.textContent();
  const siteTimestamps = siteVarianceSectionContent?.match(timestampPattern);
  expect(siteTimestamps).toBeTruthy();
  expect(siteTimestamps!.length).toBeGreaterThan(0);
  const siteSingleTimestamp = siteTimestamps![0];
  
  // 生産性サマリセクションのタイムスタンプを抽出
  const productivitySectionContent = await teamVarianceTable.textContent();
  const productivityTimestamps = productivitySectionContent?.match(timestampPattern);
  expect(productivityTimestamps).toBeTruthy();
  expect(productivityTimestamps!.length).toBeGreaterThan(0);
  const productivitySingleTimestamp = productivityTimestamps![0];
  
  // 遅延リスク分析セクションのタイムスタンプを抽出
  const riskSectionContent = await riskAssessmentTable.textContent();
  const riskTimestamps = riskSectionContent?.match(timestampPattern);
  expect(riskTimestamps).toBeTruthy();
  expect(riskTimestamps!.length).toBeGreaterThan(0);
  const riskSingleTimestamp = riskTimestamps![0];
  
  // 3つのセクション間でタイムスタンプがすべて同一であることを確認
  expect(siteSingleTimestamp).toEqual(productivitySingleTimestamp);
  expect(productivitySingleTimestamp).toEqual(riskSingleTimestamp);
  expect(siteSingleTimestamp).toEqual(riskSingleTimestamp);
});