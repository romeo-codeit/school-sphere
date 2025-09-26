import re
import time
import os
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Create a dummy file for upload
    dummy_file_path = "jules-scratch/verification/test_upload.txt"
    with open(dummy_file_path, "w") as f:
        f.write("This is a test file for resource upload.")

    try:
        # 1. Login as teacher
        page.goto("http://localhost:5173/login")

        email_input = page.get_by_placeholder("m@example.com")
        expect(email_input).to_be_visible(timeout=15000)
        email_input.fill("teacher@example.com")

        password_input = page.locator('input[id="password"]')
        expect(password_input).to_be_visible()
        password_input.fill("password123")

        page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to dashboard
        expect(page).to_have_url(re.compile(".*"), timeout=10000)
        expect(page.get_by_text("Dashboard")).to_be_visible()

        # 2. Navigate to Resources page
        page.get_by_role("link", name="Resources").click()
        expect(page).to_have_url(re.compile(".*resources"), timeout=10000)

        # 3. Open the upload form
        page.get_by_role("button", name="Upload").click()
        expect(page.get_by_text("Upload New Resource")).to_be_visible()

        # 4. Fill out the form and upload a file
        resource_title = f"Test Resource {int(time.time())}"
        page.get_by_label("Title").fill(resource_title)
        page.get_by_label("Description").fill("This is a test resource description.")
        page.get_by_label("Subject").fill("Testing")

        # Set the file for upload
        page.set_input_files('input[type="file"]', dummy_file_path)

        # Verify the file name is shown
        expect(page.get_by_text("test_upload.txt")).to_be_visible()

        page.get_by_role("button", name="Submit").click()

        # 5. Verify the new resource appears in the list
        expect(page.get_by_text(resource_title)).to_be_visible(timeout=10000)
        page.screenshot(path="jules-scratch/verification/resources-1-created.png")

        # 6. Find the new resource card and test its actions
        new_resource_card = page.locator(".card", has_text=resource_title).first

        # Test delete
        new_resource_card.get_by_role("button").filter(has=page.locator("svg.lucide-more-horizontal")).click()
        page.get_by_role("menuitem", name="Delete").click()

        # Confirm deletion
        expect(page.get_by_text("Are you sure?")).to_be_visible()
        page.get_by_role("button", name="Delete").click()

        # 7. Verify the resource is gone
        expect(page.get_by_text("Resource deleted.")).to_be_visible(timeout=5000)
        expect(page.get_by_text(resource_title)).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/resources-2-deleted.png")

    finally:
        browser.close()
        os.remove(dummy_file_path)


with sync_playwright() as playwright:
    run(playwright)