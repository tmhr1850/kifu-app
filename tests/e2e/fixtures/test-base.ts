import { test as base } from '@playwright/test';
import { HomePage, LoginPage, GamePage } from '../pages';

type MyFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  gamePage: GamePage;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  gamePage: async ({ page }, use) => {
    const gamePage = new GamePage(page);
    await use(gamePage);
  },
});

export { expect } from '@playwright/test';