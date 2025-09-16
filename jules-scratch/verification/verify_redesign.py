import re
from playwright.sync_api import Page, expect
import os

def test_redesign_verification(page: Page):
    # Navigate to students page and take screenshot
    page.goto("http://localhost:5175/students")
    page.wait_for_selector("table")
    page.screenshot(path="jules-scratch/verification/students-page.png")

    # Navigate to teachers page and take screenshot
    page.goto("http://localhost:5175/teachers")
    page.wait_for_selector("table")
    page.screenshot(path="jules-scratch/verification/teachers-page.png")

    # Navigate to a student profile page and take screenshot
    page.goto("http://localhost:5175/students")
    page.wait_for_selector("table")
    page.locator('button:has-text("View Details")').first.click()
    expect(page.get_by_role("heading", name="Student Profile")).to_be_visible(timeout=10000)
    page.screenshot(path="jules-scratch/verification/student-profile-page.png")

    # Navigate to a teacher profile page and take screenshot
    page.goto("http://localhost:5175/teachers")
    page.wait_for_selector("table")
    page.locator('button:has-text("View Details")').first.click()
    expect(page.get_by_role("heading", name="Teacher Profile")).to_be_visible(timeout=10000)
    page.screenshot(path="jules-scratch/verification/teacher-profile-page.png")
