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

        # 2. Navigate to Communications page
        page.get_by_role("link", name="Communications").click()
        expect(page).to_have_url(re.compile(".*communications"), timeout=10000)

        # --- CHAT VERIFICATION ---

        # 3. Start a new chat
        page.get_by_role("button", name="New Chat").click()
        expect(page.get_by_text("Start a new conversation")).to_be_visible()

        # Select a student to chat with
        page.get_by_placeholder("Search for users...").fill("John Doe")
        page.get_by_role("option", name="John Doe").click()
        page.get_by_role("button", name="Start Chat").click()

        # 4. Send a message
        expect(page.get_by_text("Chat with John Doe")).to_be_visible(timeout=5000)
        chat_message = f"Hello John! This is a test message at {time.time()}"
        message_input = page.get_by_placeholder("Type a message...")
        message_input.fill(chat_message)
        page.get_by_role("button", name="Send").click()

        # 5. Verify message appears
        expect(page.get_by_text(chat_message)).to_be_visible(timeout=5000)
        page.screenshot(path="jules-scratch/verification/comm-1-chat-sent.png")

        # --- FORUM VERIFICATION ---

        # 6. Switch to Forum tab and create a new thread
        page.get_by_role("tab", name="Forum").click()
        page.get_by_role("button", name="New Thread").click()

        thread_title = f"Test Thread {int(time.time())}"
        thread_content = "This is the content of the test thread."

        page.get_by_label("Title").fill(thread_title)
        page.get_by_label("Content").fill(thread_content)
        page.get_by_role("button", name="Create Thread").click()

        # 7. Verify thread is created and navigate into it
        expect(page.get_by_text(thread_title)).to_be_visible(timeout=5000)
        page.get_by_text(thread_title).click()

        # 8. Post a reply
        reply_content = "This is a reply to the test thread."
        page.get_by_placeholder("Write a reply...").fill(reply_content)
        page.get_by_role("button", name="Post Reply").click()

        # 9. Verify reply appears
        expect(page.get_by_text(reply_content)).to_be_visible(timeout=5000)
        page.screenshot(path="jules-scratch/verification/comm-2-forum-reply.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)