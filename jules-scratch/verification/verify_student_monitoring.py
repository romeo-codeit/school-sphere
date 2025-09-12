from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Login
    page.goto("http://localhost:5175/login")
    page.locator("#email").fill("timothydivine9@gmail.com")
    page.locator("#password").fill("aabBbcc123!")
    page.get_by_role("button", name="Sign In").click()
    expect(page.get_by_role("heading", name="Admin")).to_be_visible(timeout=10000)

    # 2. Navigate to students page
    page.get_by_role("link", name="Students").click()
    expect(page.get_by_role("heading", name="Students")).to_be_visible(timeout=10000)
    page.wait_for_selector("tbody tr")

    # 3. Navigate to student profile
    first_student_row = page.locator("tbody tr").first
    first_student_row.get_by_role("button").click()
    page.get_by_role("menuitem", name="View Details").click()
    expect(page.get_by_role("heading", name="Student Profile")).to_be_visible(timeout=10000)

    # 4. Check Attendance Tab
    attendance_tab = page.get_by_role("tab", name="Attendance")
    attendance_tab.click()
    page.wait_for_timeout(2000) # Wait for content to render
    page.screenshot(path="jules-scratch/verification/student_profile_attendance_debug.png")

    # 5. Check Payments Tab
    payments_tab = page.get_by_role("tab", name="Payments")
    payments_tab.click()
    page.wait_for_timeout(2000) # Wait for content to render
    page.screenshot(path="jules-scratch/verification/student_profile_payments_debug.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
