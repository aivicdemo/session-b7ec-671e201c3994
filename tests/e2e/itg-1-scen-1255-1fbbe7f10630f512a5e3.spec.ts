import { test, expect } from '@playwright/test';

test('SCEN-1255: 進捗遅延リスク分析実行 - 作業者未配置エラー', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1789461783315.html');
  
  // ページが完全に読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 拠点フィルターを取得して、作業者が配置されていない拠点を選択
  const siteFilter = page.getByTestId('site-filter');
  await siteFilter.click();
  
  // ドロップダウンメニューから作業者が配置されていない拠点を選択
  // 大阪拠点を選択（作業者が配置されていない状態）
  const osakaOption = page.getByText('大阪拠点');
  await osakaOption.click();
  
  // フィルター選択後、ページが更新されるまで待機
  await page.waitForLoadState('networkidle');

  // 進捗遅延リスク分析を実行ボタンをクリック
  const optimizeButton = page.getByTestId('optimize-button');
  await optimizeButton.click();

  // エラーメッセージが表示されるまで待機
  await page.waitForTimeout(500);

  // 期待されるエラーメッセージが表示されていることを確認
  const errorMessage = page.getByText('作業者が配置されていません。人員配置を確認してください');
  await expect(errorMessage).toBeVisible();

  // リスク分析結果の表示エリアが空白であることを確認
  const riskAssessmentTable = page.getByTestId('risk-assessment-table');
  const tableRows = riskAssessmentTable.locator('tbody tr');
  await expect(tableRows).toHaveCount(0);

  // 人員配置を設定するボタンまたは人員配置画面へのリンクがアクセス可能であることを確認
  const staffPlacementButton = page.getByRole('button', { name: /人員配置/i });
  await expect(staffPlacementButton).toBeVisible();
});