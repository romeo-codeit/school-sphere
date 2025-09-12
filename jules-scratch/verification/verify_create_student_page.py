from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Login as admin
    page.goto("http://localhost:5175/login")
    page.locator("#email").fill("timothydivine9@gmail.com")
    page.locator("#password").fill("aabBbcc123!")
    page.get_by_role("button", name="Sign In").click()
    expect(page.get_by_role("heading", name="Admin")).to_be_visible(timeout=10000)

    # 2. Screenshot the dashboard with the new button
    page.screenshot(path="jules-scratch/verification/dashboard_with_temp_button.png")

    # 3. Navigate to the create student user page
    page.get_by_role("button", name="Create Student User (Temp)").click()
    page.wait_for_timeout(2000) # Allow time for the page to render

    # 4. Screenshot the new page
    page.screenshot(path="jules-scratch/verification/create_student_user_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
