from playwright.sync_api import sync_playwright, Page

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Go to the landing page.
    page.goto("http://localhost:5173/")

    # 2. Wait for a moment to ensure the page has started rendering.
    page.wait_for_timeout(2000) # 2 seconds

    # 3. Take a screenshot.
    page.screenshot(path="jules-scratch/verification/landing_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
