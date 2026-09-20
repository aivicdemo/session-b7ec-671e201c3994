import { test, expect } from '@playwright/test';

test.describe('SCEN-1194: ダッシュボード表示時に拠点別・チーム別の進捗状況が集約され画面に表示される', () => {
  test('ダッシュボード表示', async ({ page }) => {
    // ブラウザで『進捗・人員配置ダッシュボード』画面にアクセスする
    await page.goto('/panels/scr-1789461783315.html');

    // ページ読み込み完了を待つ（ローディング表示が消える）
    await page.waitForSelector('[data-testid="kpi-risk-count"]', { state: 'visible' });
    
    // ローディング表示が存在する場合は消えるまで待機
    const loadingElements = page.locator('text=読込中');
    if (await loadingElements.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await loadingElements.first().waitFor({ state: 'hidden' });
    }

    // 画面上に『拠点別進捗サマリー』セクションが表示されていることを確認する
    const siteVarianceTable = page.locator('#site-variance-tbody');
    await expect(siteVarianceTable).toBeVisible();

    // 『拠点別進捗サマリー』内に『拠点A』というラベルが表示されていることを確認する
    await expect(siteVarianceTable.locator('text=拠点A')).toBeVisible();

    // 『拠点別進捗サマリー』内に『拠点B』というラベルが表示されていることを確認する
    await expect(siteVarianceTable.locator('text=拠点B')).toBeVisible();

    // 画面上に『チーム別進捗詳細』セクションが表示されていることを確認する
    const teamVarianceTable = page.locator('#team-variance-tbody');
    await expect(teamVarianceTable).toBeVisible();

    // 『チーム別進捗詳細』内のテーブル/カード要素をスクロールして、以下の情報が表示されていることを目視確認する
    // 『拠点A・チーム1』、『拠点A・チーム2』、『拠点B・チーム1』、それぞれに対応する進捗率（75%、60%、80%）
    const teamRows = teamVarianceTable.locator('tr');
    const rowCount = await teamRows.count();
    
    // 拠点A・チーム1を確認（進捗率75%、低リスク15%）
    let foundTeam1A = false;
    let foundTeam1AProgress = false;
    let foundTeam1ARisk = false;
    
    for (let i = 0; i < rowCount; i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('拠点A') && rowText.includes('チーム1')) {
        foundTeam1A = true;
        if (rowText.includes('75%')) {
          foundTeam1AProgress = true;
        }
        if (rowText.includes('低リスク（15%）')) {
          foundTeam1ARisk = true;
        }
      }
    }
    expect(foundTeam1A).toBeTruthy();
    expect(foundTeam1AProgress).toBeTruthy();
    expect(foundTeam1ARisk).toBeTruthy();

    // 拠点A・チーム2を確認（進捗率60%、高リスク35%）
    let foundTeam2A = false;
    let foundTeam2AProgress = false;
    let foundTeam2ARisk = false;
    
    for (let i = 0; i < rowCount; i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('拠点A') && rowText.includes('チーム2')) {
        foundTeam2A = true;
        if (rowText.includes('60%')) {
          foundTeam2AProgress = true;
        }
        if (rowText.includes('高リスク（35%）')) {
          foundTeam2ARisk = true;
        }
      }
    }
    expect(foundTeam2A).toBeTruthy();
    expect(foundTeam2AProgress).toBeTruthy();
    expect(foundTeam2ARisk).toBeTruthy();

    // 拠点B・チーム1を確認（進捗率80%、低リスク8%）
    let foundTeam1B = false;
    let foundTeam1BProgress = false;
    let foundTeam1BRisk = false;
    
    for (let i = 0; i < rowCount; i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText && rowText.includes('拠点B') && rowText.includes('チーム1')) {
        foundTeam1B = true;
        if (rowText.includes('80%')) {
          foundTeam1BProgress = true;
        }
        if (rowText.includes('低リスク（8%）')) {
          foundTeam1BRisk = true;
        }
      }
    }
    expect(foundTeam1B).toBeTruthy();
    expect(foundTeam1BProgress).toBeTruthy();
    expect(foundTeam1BRisk).toBeTruthy();

    // 表示順序は拠点コード順（A→B）、チームコード順（1→2）で整列されていることを確認
    const orderedTeams: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = teamRows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText) {
        if (rowText.includes('拠点A') && rowText.includes('チーム1')) {
          orderedTeams.push('拠点A・チーム1');
        } else if (rowText.includes('拠点A') && rowText.includes('チーム2')) {
          orderedTeams.push('拠点A・チーム2');
        } else if (rowText.includes('拠点B') && rowText.includes('チーム1')) {
          orderedTeams.push('拠点B・チーム1');
        }
      }
    }
    
    expect(orderedTeams).toContain('拠点A・チーム1');
    expect(orderedTeams).toContain('拠点A・チーム2');
    expect(orderedTeams).toContain('拠点B・チーム1');
    expect(orderedTeams[0]).toBe('拠点A・チーム1');
    expect(orderedTeams[1]).toBe('拠点A・チーム2');
    expect(orderedTeams[2]).toBe('拠点B・チーム1');
  });
});