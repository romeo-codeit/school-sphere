import re
from playwright.sync_api import sync_playwright, Page, expect

def login_as(page: Page, email: str, password: str = "password123"):
    page.goto("http://localhost:5173/login")
    email_input = page.get_by_placeholder("m@example.com")
    expect(email_input).to_be_visible(timeout=15000)
    email_input.fill(email)

    password_input = page.locator('input[id="password"]')
    expect(password_input).to_be_visible()
    password_input.fill(password)

    page.get_by_role("button", name="Sign In").click()
    expect(page).to_have_url(re.compile(".*"), timeout=10000)
    expect(page.get_by_text("Dashboard")).to_be_visible()

def logout(page: Page):
    page.get_by_test_id("button-logout").click()
    expect(page).to_have_url(re.compile(".*login"), timeout=10000)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Verify Admin Dashboard
        login_as(page, "admin@example.com")
        expect(page.get_by_text("Admin Dashboard")).to_be_visible()
        expect(page.get_by_text("Total Students")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/dashboard-admin.png")
        logout(page)

        # 2. Verify Teacher Dashboard
        login_as(page, "teacher@example.com")
        expect(page.get_by_text("Teacher Dashboard")).to_be_visible()
        expect(page.get_by_text("Assigned Classes")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/dashboard-teacher.png")
        logout(page)

        # 3. Verify Student Dashboard
        login_as(page, "student@example.com")
        expect(page.get_by_text("Student Dashboard")).to_be_visible()
        expect(page.get_by_text("My Profile")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/dashboard-student.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)