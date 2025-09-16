import re
from playwright.sync_api import Page, expect
import os

def test_create_student(page: Page):
    # Log in
    page.goto("http://localhost:5175/login")
    page.locator("#email").fill(os.environ["SCHOOLSPHERE_EMAIL"])
    page.locator("#password").fill(os.environ["SCHOOLSPHERE_PASSWORD"])
    page.get_by_role("button", name="Sign In").click()

    # Wait for the dashboard to be visible
    expect(page.get_by_role("heading", name="Admin")).to_be_visible(timeout=10000)

    # Navigate to students page
    page.get_by_role("link", name="Students").click()
    expect(page).to_have_url(re.compile(".*students"))

    # Click add student button
    page.get_by_role("button", name="Add Student").click()

    # Fill out the form
    page.get_by_test_id("input-student-id").fill("ST-001")
    page.get_by_test_id("select-class").click()
    page.get_by_role("option", name="JSS 1A").click()
    page.get_by_test_id("input-first-name").fill("John")
    page.get_by_test_id("input-last-name").fill("Doe")
    page.get_by_test_id("input-email").fill("john.doe@example.com")
    page.get_by_test_id("input-phone").fill("1234567890")
    page.get_by_test_id("input-date-of-birth").fill("2010-01-01")
    page.get_by_test_id("textarea-address").fill("123 Main St")
    page.get_by_test_id("input-parent-name").fill("Jane Doe")
    page.get_by_test_id("input-parent-phone").fill("0987654321")
    page.get_by_test_id("input-parent-email").fill("jane.doe@example.com")
    page.get_by_test_id("select-status").click()
    page.get_by_role("option", name="Active", exact=True).click()

    # Submit the form
    page.get_by_test_id("button-submit").click()

    # Verify the student was created
    expect(page.locator("div.text-sm.opacity-90").filter(has_text="Student created successfully")).to_be_visible()

    # Search for the new student
    page.get_by_test_id("input-search-students").fill("ST-001")

    # Check if the student is in the table
    expect(page.get_by_role("cell", name="John Doe")).to_be_visible()
    expect(page.get_by_role("cell", name="ST-001")).to_be_visible()
