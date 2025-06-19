import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly selectors = {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"]:has-text("ログイン")',
    signupLink: 'a[href="/auth/signup"]',
    resetPasswordLink: 'a[href="/auth/reset-password"]',
    errorMessage: '[role="alert"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
    googleLoginButton: 'button:has-text("Googleでログイン")',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate('/auth/login');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.fillInput(this.selectors.emailInput, email);
    await this.fillInput(this.selectors.passwordInput, password);
    await this.clickElement(this.selectors.loginButton);
    
    // Wait for either navigation or error
    await Promise.race([
      this.waitForNavigation('/'),
      this.waitForElement(this.selectors.errorMessage, { timeout: 5000 }).catch(() => {})
    ]);
  }

  async getErrorMessage(): Promise<string> {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.getElementText(this.selectors.errorMessage);
    }
    return '';
  }

  async navigateToSignup() {
    await this.clickElement(this.selectors.signupLink);
    await this.waitForNavigation('/auth/signup');
  }

  async navigateToResetPassword() {
    await this.clickElement(this.selectors.resetPasswordLink);
    await this.waitForNavigation('/auth/reset-password');
  }

  async isLoadingVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.loadingSpinner);
  }

  async waitForLoginToComplete() {
    // Wait for loading to disappear
    await this.page.waitForSelector(this.selectors.loadingSpinner, { state: 'hidden' });
  }
}