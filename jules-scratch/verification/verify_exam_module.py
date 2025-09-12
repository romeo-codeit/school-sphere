from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Login as student
    page.goto("http://localhost:5175/login")
    page.locator("#email").fill("student@example.com")
    page.locator("#password").fill("password123")
    page.get_by_role("button", name="Sign In").click()

    # 2. Wait and take a screenshot of the student dashboard
    page.wait_for_timeout(3000)
    page.screenshot(path="jules-scratch/verification/student_dashboard.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
