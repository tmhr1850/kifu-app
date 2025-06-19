import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/e2e/screenshots/${name}.png` });
  }

  async waitForElement(selector: string, options?: { timeout?: number }) {
    await this.page.waitForSelector(selector, options);
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async getElementText(selector: string): Promise<string> {
    const element = await this.page.$(selector);
    return element ? await element.textContent() || '' : '';
  }

  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async waitForNavigation(url?: string | RegExp) {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }
}