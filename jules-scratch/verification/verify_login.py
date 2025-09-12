from playwright.sync_api import sync_playwright, Page

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Go to the login page.
    page.goto("http://localhost:5173/login")

    # 2. Fill in the new credentials.
    page.locator("#email").fill("timothydivine9@gmail.com")
    page.locator("#password").fill("aabBbcc123!")

    # 3. Click the "Sign In" button.
    page.get_by_role("button", name="Sign In").click()

    # 4. Wait for navigation and rendering.
    page.wait_for_timeout(3000)

    # 5. Take a screenshot of the page after login attempt.
    page.screenshot(path="jules-scratch/verification/after_login_attempt_2.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
