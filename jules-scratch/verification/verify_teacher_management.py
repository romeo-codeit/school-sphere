import re
import time
from playwright.sync_api import sync_playwright, Page, expect

def login_as_admin(page: Page):
    page.goto("http://localhost:5173/login")
    email_input = page.get_by_placeholder("m@example.com")
    expect(email_input).to_be_visible(timeout=15000)
    email_input.fill("admin@example.com")

    password_input = page.locator('input[id="password"]')
    expect(password_input).to_be_visible()
    password_input.fill("password123")

    page.get_by_role("button", name="Sign In").click()
    expect(page).to_have_url(re.compile(".*"), timeout=10000)
    expect(page.get_by_text("Dashboard")).to_be_visible()

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        login_as_admin(page)

        # 1. Navigate to Teachers page
        page.get_by_role("link", name="Teachers").click()
        expect(page.get_by_text("Teacher Management")).to_be_visible()

        # 2. Create a new teacher
        page.get_by_role("button", name="Add Teacher").click()

        employee_id = f"EMP-{int(time.time())}"
        first_name = "Test"
        last_name = "Teacher"

        page.get_by_label("Employee ID").fill(employee_id)
        page.get_by_label("First Name").fill(first_name)
        page.get_by_label("Last Name").fill(last_name)
        page.get_by_role("button", name="Create Teacher").click()

        # 3. Verify teacher appears in the list
        expect(page.get_by_text(f"{first_name} {last_name}")).to_be_visible(timeout=5000)
        page.screenshot(path="jules-scratch/verification/teacher-1-created.png")

        # 4. Find the new teacher and test delete
        teacher_row = page.get_by_role("row").filter(has_text=employee_id)
        teacher_row.get_by_role("button").click() # Open dropdown
        page.get_by_role("menuitem", name="Delete").click()

        # Confirm deletion
        expect(page.get_by_text("Are you sure?")).to_be_visible()
        page.get_by_role("button", name="Delete").click()

        # 5. Verify the teacher is gone
        expect(page.get_by_text("Teacher deleted successfully")).to_be_visible(timeout=5000)
        expect(page.get_by_text(f"{first_name} {last_name}")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/teacher-2-deleted.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)