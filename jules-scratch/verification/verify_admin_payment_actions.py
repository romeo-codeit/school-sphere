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

        # 2. Navigate to Payments page
        page.get_by_role("link", name="Payments").click()
        expect(page).to_have_url(re.compile(".*payments"), timeout=10000)

        # 3. Verify the payments table is visible
        expect(page.get_by_text("Payment Management")).to_be_visible()

        # 4. Take a screenshot of the initial view
        page.screenshot(path="jules-scratch/verification/admin-payments-view.png")

        # 5. Test 'Mark as Paid'
        # Find a pending payment and click 'Mark Paid'
        pending_payment_row = page.get_by_role("row").filter(has_text="pending").first
        expect(pending_payment_row).to_be_visible()
        mark_paid_button = pending_payment_row.get_by_role("button", name="Mark Paid")
        mark_paid_button.click()

        # Check for success toast
        expect(page.get_by_text("Payment marked as paid.")).to_be_visible()

        # 6. Take a screenshot after marking as paid
        page.screenshot(path="jules-scratch/verification/admin-payments-marked-paid.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)