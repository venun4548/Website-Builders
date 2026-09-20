from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://127.0.0.1:5000/super-admin')
    
    # Wait for the table to load
    page.wait_for_selector('#tbl-enquiries-body tr td')
    
    # Give it a second just in case
    page.wait_for_timeout(1000)
    
    # Try clicking the first eye icon
    btn = page.locator('.fa-eye').first
    if btn.count() > 0:
        print("Clicking view button...")
        # Add an event listener to console logs to catch any JS errors
        page.on("console", lambda msg: print(f"Browser console: {msg.type} {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))
        
        btn.click()
        page.wait_for_timeout(1000)
        
        # Check if modal is visible
        modal = page.locator('#modal-enquiry-details')
        print(f"Modal classes: {modal.get_attribute('class')}")
        print(f"Modal style display: {modal.evaluate('el => window.getComputedStyle(el).display')}")
    else:
        print("No view button found. Table contents:")
        print(page.locator('#tbl-enquiries-body').inner_text())

    browser.close()
