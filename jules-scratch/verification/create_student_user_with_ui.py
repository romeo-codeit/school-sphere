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

    # 2. Navigate to the create user page
    page.get_by_role("button", name="Create New User").click()
    page.wait_for_load_state('networkidle', timeout=10000)
    expect(page.get_by_role("heading", name="Create New User")).to_be_visible(timeout=15000)

    # 3. Fill out the form to create a student
    page.locator("#name").fill("Test Student")
    page.locator("#email").fill("student1@example.com")
    page.locator("#password").fill("password123")
    page.locator("#role").click()
    page.get_by_role("option", name="Student").click()

    # 4. Submit the form
    page.get_by_role("button", name="Create User").click()

    # 5. Verify the success message and take a screenshot
    success_message = page.get_by_text("User student1@example.com with role student created successfully!")
    expect(success_message).to_be_visible(timeout=10000)
    page.screenshot(path="jules-scratch/verification/student_user_created_success.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
