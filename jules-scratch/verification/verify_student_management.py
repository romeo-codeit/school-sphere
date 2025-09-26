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

        # 1. Navigate to Students page
        page.get_by_role("link", name="Students").click()
        expect(page.get_by_text("Student Management")).to_be_visible()

        # 2. Create a new student
        page.get_by_role("button", name="Add Student").click()

        student_id = f"TEST-{int(time.time())}"
        first_name = "Test"
        last_name = "Student"

        page.get_by_label("Student ID").fill(student_id)
        page.get_by_label("First Name").fill(first_name)
        page.get_by_label("Last Name").fill(last_name)
        page.get_by_label("Class").click()
        page.get_by_role("option", name="SS1 Science").click()
        page.get_by_role("button", name="Create Student").click()

        # 3. Verify student appears in the list
        expect(page.get_by_text(f"{first_name} {last_name}")).to_be_visible(timeout=5000)
        page.screenshot(path="jules-scratch/verification/student-1-created.png")

        # 4. Find the new student and test delete
        student_row = page.get_by_role("row").filter(has_text=student_id)
        student_row.get_by_role("button").click() # Open dropdown
        page.get_by_role("menuitem", name="Delete").click()

        # Confirm deletion
        expect(page.get_by_text("Are you sure?")).to_be_visible()
        page.get_by_role("button", name="Delete").click()

        # 5. Verify the student is gone
        expect(page.get_by_text("Student deleted successfully")).to_be_visible(timeout=5000)
        expect(page.get_by_text(f"{first_name} {last_name}")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/student-2-deleted.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)