import re
import time
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

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

        # 2. Navigate to Video Conferencing page
        page.get_by_role("link", name="Video Conferencing").click()
        expect(page).to_have_url(re.compile(".*video-conferencing"), timeout=10000)
        expect(page.get_by_text("Meeting Rooms")).to_be_visible()

        # 3. Create a new meeting
        page.get_by_role("button", name="Create Meeting").click()

        meeting_topic = f"Test Meeting {int(time.time())}"
        page.get_by_label("Topic").fill(meeting_topic)
        page.get_by_role("button", name="Create").click()

        # 4. Verify the new meeting appears with correct initial state
        # Use a locator that finds the card containing the new meeting topic
        new_meeting_card = page.locator(".card", has_text=meeting_topic).first

        expect(new_meeting_card).to_be_visible(timeout=10000)
        expect(new_meeting_card.get_by_text("Active")).to_be_visible()
        expect(new_meeting_card.get_by_text("0 Participants")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/vc-1-created.png")

        # 5. End the meeting
        end_button = new_meeting_card.get_by_role("button", name="End Meeting")
        expect(end_button).to_be_visible()
        end_button.click()

        # 6. Verify the meeting is now ended
        expect(new_meeting_card.get_by_text("Ended")).to_be_visible(timeout=5000)
        join_button = new_meeting_card.get_by_role("button", name="Meeting Ended")
        expect(join_button).to_be_disabled()

        page.screenshot(path="jules-scratch/verification/vc-2-ended.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)