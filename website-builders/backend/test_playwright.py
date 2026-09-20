from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating...")
        page.goto('http://127.0.0.1:5000/login')
        page.fill('input[name="email"]', 'admin@example.com')  # wait, I don't know a valid login.
        # I need a valid login to get to super-admin dashboard!
        print("Done")
        browser.close()
run()
