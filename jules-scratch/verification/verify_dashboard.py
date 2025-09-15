import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    time.sleep(5)

    page.goto("http://localhost:5175/login")

    # Login as admin
    page.get_by_label("Email").fill("admin@test.com")
    page.get_by_label("Password").fill("adminpassword")
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the dashboard
    expect(page).to_have_url("http://localhost:5173/")

    # Wait for dashboard to load
    expect(page.get_by_text("Welcome back, Admin")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/dashboard.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
