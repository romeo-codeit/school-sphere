import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Login as teacher
        page.goto("http://localhost:5173/login")

        # Wait for the email input to be visible using a different locator
        email_input = page.get_by_placeholder("m@example.com")
        expect(email_input).to_be_visible(timeout=15000) # Increased timeout

        email_input.fill("teacher@example.com")

        # Use a more specific locator for the password
        password_input = page.locator('input[id="password"]')
        expect(password_input).to_be_visible()
        password_input.fill("password123")

        page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to dashboard after login and that dashboard is visible
        expect(page).to_have_url(re.compile(".*"), timeout=10000)
        expect(page.get_by_text("Dashboard")).to_be_visible()

        # 2. Navigate to Take Attendance page
        page.get_by_test_id("link-take attendance").click()
        expect(page).to_have_url(re.compile(".*take-attendance"), timeout=10000)

        # 3. Select a class
        expect(page.get_by_role("combobox")).to_be_visible()
        page.get_by_role("combobox").click()
        page.get_by_role("option", name="SS1 Science").click()

        # 4. Verify student list is displayed
        expect(page.get_by_text("John Doe")).to_be_visible(timeout=5000)
        expect(page.get_by_text("Jane Smith")).to_be_visible()
        expect(page.get_by_text("Peter Jones")).to_be_visible()

        # 5. Take a screenshot
        page.screenshot(path="jules-scratch/verification/take-attendance-page.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)