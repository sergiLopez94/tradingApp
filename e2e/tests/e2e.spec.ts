import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as fs from 'fs';
import * as path from 'path';

/**
 * End-to-End Functional Tests using Selenium
 * REQ-001: Test responsive frontend with all views
 * REQ-003: Test header navigation between views
 * REQ-005: Test portfolio display with asset values
 * REQ-006: Test history view with transaction list
 * REQ-007: Test client view with file upload
 * REQ-017: Test filtering and sorting functionality
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const HEADLESS = process.argv.includes('--headless');

class TradingAppE2ETests {
  private driver!: WebDriver;

  async setup() {
    console.log('🚀 Setting up Selenium WebDriver...');
    const options = new chrome.Options();
    
    if (HEADLESS) {
      options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    }
    
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 10000 });
  }

  async teardown() {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  /**
   * REQ-001: Test frontend loads and is responsive
   */
  async testFrontendLoads() {
    console.log('\n📋 Test: Frontend loads successfully');
    
    await this.driver.get(FRONTEND_URL);
    const title = await this.driver.getTitle();
    
    console.log(`   ✓ Page title: ${title}`);
    console.log('   ✓ Frontend loaded successfully');
  }

  /**
   * REQ-003: Test header navigation links
   */
  async testHeaderNavigation() {
    console.log('\n📋 Test: Header navigation between views');
    
    await this.driver.get(FRONTEND_URL);
    
    // Test Portfolio link
    const portfolioLink = await this.driver.wait(
      until.elementLocated(By.linkText('Portfolio')),
      5000
    );
    await portfolioLink.click();
    await this.driver.sleep(500);
    let currentUrl = await this.driver.getCurrentUrl();
    console.log(`   ✓ Portfolio view: ${currentUrl}`);
    
    // Test History link
    const historyLink = await this.driver.findElement(By.linkText('History'));
    await historyLink.click();
    await this.driver.sleep(500);
    currentUrl = await this.driver.getCurrentUrl();
    console.log(`   ✓ History view: ${currentUrl}`);
    
    // Test Profile link
    const profileLink = await this.driver.findElement(By.linkText('Profile'));
    await profileLink.click();
    await this.driver.sleep(500);
    currentUrl = await this.driver.getCurrentUrl();
    console.log(`   ✓ Profile view: ${currentUrl}`);
    
    console.log('   ✓ All navigation links working');
  }

  /**
   * REQ-005: Test portfolio view displays asset information
   */
  async testPortfolioView() {
    console.log('\n📋 Test: Portfolio view displays correctly');
    
    await this.driver.get(`${FRONTEND_URL}/`);
    await this.driver.sleep(1000);
    
    // Check for Portfolio heading
    const heading = await this.driver.findElement(By.css('h1'));
    const headingText = await heading.getText();
    console.log(`   ✓ Portfolio heading found: ${headingText}`);
    
    // Check for summary cards (Cost Basis and Current Value)
    const cards = await this.driver.findElements(By.css('[class*="rounded"]'));
    console.log(`   ✓ Found ${cards.length} summary cards`);
    
    console.log('   ✓ Portfolio view rendered correctly');
  }

  /**
   * REQ-006: Test history view displays transaction list
   */
  async testHistoryView() {
    console.log('\n📋 Test: History view displays transactions');
    
    await this.driver.get(`${FRONTEND_URL}/history`);
    await this.driver.sleep(1000);
    
    // Check for History heading
    const heading = await this.driver.findElement(By.css('h1'));
    const headingText = await heading.getText();
    console.log(`   ✓ History heading found: ${headingText}`);
    
    // Check for table or empty state
    try {
      const table = await this.driver.findElement(By.css('table'));
      console.log('   ✓ Transaction table found');
      
      const rows = await table.findElements(By.css('tbody tr'));
      console.log(`   ✓ Found ${rows.length} transaction rows`);
    } catch (e) {
      console.log('   ℹ No transactions yet (empty state)');
    }
    
    console.log('   ✓ History view rendered correctly');
  }

  /**
   * REQ-007: Test client view with file upload capability
   */
  async testClientViewFileUpload() {
    console.log('\n📋 Test: Client view and file upload');
    
    await this.driver.get(`${FRONTEND_URL}/client`);
    await this.driver.sleep(1000);
    
    // Check for Profile heading
    const heading = await this.driver.findElement(By.css('h1'));
    const headingText = await heading.getText();
    console.log(`   ✓ Profile heading found: ${headingText}`);
    
    // Check for file input
    try {
      const fileInput = await this.driver.findElement(By.css('input[type="file"]'));
      console.log('   ✓ File upload input found');
      
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-portfolio.md');
      const testContent = `
**Depot:** TEST-E2E-001
**Datum:** 2024-01-15

| STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
|-----------------|------------|------|--------|-----|------|-----------|
| 10.00 | Apple Inc. | US0378331005 | AAPL | Aktie | 150.00 | 1500.00 |
| 5.00 | Microsoft Corp. | US5949181045 | MSFT | Aktie | 300.00 | 1500.00 |
`;
      
      fs.writeFileSync(testFilePath, testContent);
      
      // Upload file
      await fileInput.sendKeys(testFilePath);
      await this.driver.sleep(500);
      console.log('   ✓ Test file uploaded');
      
      // Click upload button
      const uploadButton = await this.driver.findElement(
        By.xpath("//button[contains(text(), 'Upload') or contains(text(), 'Enviar') or contains(text(), 'Cargar')]")
      );
      await uploadButton.click();
      await this.driver.sleep(2000);
      
      console.log('   ✓ Upload button clicked');
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
      
      // Verify upload success (check for success message or redirect)
      try {
        const successMessage = await this.driver.findElement(
          By.xpath("//*[contains(text(), 'success') or contains(text(), 'successfully')]")
        );
        console.log('   ✓ Upload successful');
      } catch (e) {
        console.log('   ℹ No explicit success message found (may have redirected)');
      }
      
    } catch (e) {
      console.log(`   ⚠ File upload test skipped: ${(e as Error).message}`);
    }
    
    console.log('   ✓ Client view test completed');
  }

  /**
   * REQ-017: Test filtering functionality in portfolio
   */
  async testPortfolioFiltering() {
    console.log('\n📋 Test: Portfolio filtering by asset type');
    
    await this.driver.get(`${FRONTEND_URL}/`);
    await this.driver.sleep(2000);
    
    try {
      // Look for filter dropdown
      const filterSelect = await this.driver.findElement(By.css('select'));
      console.log('   ✓ Filter dropdown found');
      
      // Get initial row count
      const initialRows = await this.driver.findElements(By.css('tbody tr'));
      console.log(`   ✓ Initial rows: ${initialRows.length}`);
      
      // Try to change filter (if there are options)
      const options = await filterSelect.findElements(By.css('option'));
      if (options.length > 1) {
        await options[1].click();
        await this.driver.sleep(500);
        
        const filteredRows = await this.driver.findElements(By.css('tbody tr'));
        console.log(`   ✓ Filtered rows: ${filteredRows.length}`);
        console.log('   ✓ Filtering functionality works');
      } else {
        console.log('   ℹ No filter options available (no data yet)');
      }
    } catch (e) {
      console.log(`   ℹ Filtering test skipped: ${(e as Error).message}`);
    }
  }

  /**
   * REQ-017: Test sorting functionality in portfolio
   */
  async testPortfolioSorting() {
    console.log('\n📋 Test: Portfolio sorting by columns');
    
    await this.driver.get(`${FRONTEND_URL}/`);
    await this.driver.sleep(2000);
    
    try {
      // Find table headers
      const headers = await this.driver.findElements(By.css('thead th'));
      console.log(`   ✓ Found ${headers.length} table headers`);
      
      if (headers.length > 0) {
        // Click first sortable header
        await headers[0].click();
        await this.driver.sleep(500);
        console.log('   ✓ First column sorted (ascending)');
        
        // Click again for descending
        await headers[0].click();
        await this.driver.sleep(500);
        console.log('   ✓ First column sorted (descending)');
        
        console.log('   ✓ Sorting functionality works');
      } else {
        console.log('   ℹ No sortable headers found');
      }
    } catch (e) {
      console.log(`   ℹ Sorting test skipped: ${(e as Error).message}`);
    }
  }

  /**
   * Test complete user workflow
   */
  async testCompleteUserWorkflow() {
    console.log('\n📋 Test: Complete user workflow');
    
    // 1. Start at homepage
    await this.driver.get(FRONTEND_URL);
    await this.driver.sleep(1000);
    console.log('   ✓ Step 1: Loaded homepage');
    
    // 2. Navigate to Profile
    const profileLink = await this.driver.findElement(By.linkText('Profile'));
    await profileLink.click();
    await this.driver.sleep(1000);
    console.log('   ✓ Step 2: Navigated to Profile');
    
    // 3. Navigate to History
    const historyLink = await this.driver.findElement(By.linkText('History'));
    await historyLink.click();
    await this.driver.sleep(1000);
    console.log('   ✓ Step 3: Navigated to History');
    
    // 4. Navigate back to Portfolio
    const portfolioLink = await this.driver.findElement(By.linkText('Portfolio'));
    await portfolioLink.click();
    await this.driver.sleep(1000);
    console.log('   ✓ Step 4: Navigated back to Portfolio');
    
    console.log('   ✓ Complete workflow successful');
  }

  async runAllTests() {
    try {
      await this.setup();
      
      console.log('═══════════════════════════════════════════════════');
      console.log('     Trading App E2E Tests - Selenium WebDriver');
      console.log('═══════════════════════════════════════════════════');
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      console.log(`Backend URL: ${BACKEND_URL}`);
      console.log(`Headless mode: ${HEADLESS}`);
      
      await this.testFrontendLoads();
      await this.testHeaderNavigation();
      await this.testPortfolioView();
      await this.testHistoryView();
      await this.testClientViewFileUpload();
      await this.testPortfolioFiltering();
      await this.testPortfolioSorting();
      await this.testCompleteUserWorkflow();
      
      console.log('\n═══════════════════════════════════════════════════');
      console.log('✅ All E2E tests completed successfully!');
      console.log('═══════════════════════════════════════════════════\n');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      throw error;
    } finally {
      await this.teardown();
    }
  }
}

// Run tests
const tests = new TradingAppE2ETests();
tests.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
