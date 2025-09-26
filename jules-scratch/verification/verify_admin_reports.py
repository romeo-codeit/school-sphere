import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Login as admin
        page.goto("http://localhost:5173/login")

        email_input = page.get_by_placeholder("m@example.com")
        expect(email_input).to_be_visible(timeout=15000)
        email_input.fill("admin@example.com")

        password_input = page.locator('input[id="password"]')
        expect(password_input).to_be_visible()
        password_input.fill("password123")

        page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to dashboard
        expect(page).to_have_url(re.compile(".*"), timeout=10000)
        expect(page.get_by_text("Dashboard")).to_be_visible()

        # 2. Navigate to Attendance Reports page
        page.get_by_test_id("link-attendance reports").click()
        expect(page).to_have_url(re.compile(".*attendance-reports"), timeout=10000)

        # 3. Verify report elements are displayed
        expect(page.get_by_text("Overall Attendance")).to_be_visible()
        expect(page.get_by_text("Daily Attendance Trend")).to_be_visible()

        # 4. Take a screenshot
        page.screenshot(path="jules-scratch/verification/admin-reports-view.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)