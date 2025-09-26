import re
import time
from playwright.sync_api import sync_playwright, Page, expect

def login_as_teacher(page: Page):
    page.goto("http://localhost:5173/login")
    email_input = page.get_by_placeholder("m@example.com")
    expect(email_input).to_be_visible(timeout=15000)
    email_input.fill("teacher@example.com")

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
        login_as_teacher(page)

        # 1. Test Global Search
        search_input = page.get_by_placeholder("Search...")
        expect(search_input).to_be_visible()
        search_input.fill("John Doe")

        # Verify search results dropdown appears
        expect(page.get_by_text("Students")).to_be_visible(timeout=5000)
        expect(page.get_by_role("option", name="John Doe")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/final-1-search.png")
        # Clear search
        search_input.fill("")

        # 2. Test Notification Dropdown
        notification_button = page.get_by_role("button").filter(has=page.locator("svg.lucide-bell"))
        notification_button.click()
        expect(page.get_by_text("Notifications")).to_be_visible()
        expect(page.get_by_text("Mark all as read")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/final-2-notifications.png")
        page.keyboard.press("Escape") # Close popover

        # 3. Test Profile Dropdown and Page Navigation
        page.get_by_role("button", has=page.locator('img[alt="User profile"]')).click()
        page.get_by_role("menuitem", name="Profile").click()

        expect(page).to_have_url(re.compile(".*profile"), timeout=5000)
        expect(page.get_by_text("Update Profile")).to_be_visible()

        # 4. Update user name
        new_name = f"Teacher User {int(time.time())}"
        name_input = page.get_by_label("Full Name")
        name_input.fill(new_name)
        page.get_by_role("button", name="Save Changes").click()

        # 5. Verify name update
        expect(page.get_by_text("Your name has been updated.")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/final-3-profile-updated.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)