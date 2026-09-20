from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

options = webdriver.EdgeOptions()
options.add_argument('--headless')
driver = webdriver.Edge(options=options)

try:
    print("Navigating...")
    driver.get('http://127.0.0.1:5000/super-admin')
    
    # Enable console log capturing
    logs = driver.get_log('browser')
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "#tbl-enquiries-body tr td"))
    )
    
    time.sleep(1)
    print("Table loaded. Finding eye buttons...")
    buttons = driver.find_elements(By.CSS_SELECTOR, '.fa-eye')
    print(f"Found {len(buttons)} view buttons")
    
    if buttons:
        # Get parent button
        btn = buttons[0].find_element(By.XPATH, "..")
        print(f"Button HTML: {btn.get_attribute('outerHTML')}")
        
        # Click via JS in case of overlays
        driver.execute_script("arguments[0].click();", btn)
        time.sleep(1)
        
        modal = driver.find_element(By.ID, 'modal-enquiry-details')
        print(f"Modal class: {modal.get_attribute('class')}")
        
        new_logs = driver.get_log('browser')
        for log in new_logs:
            print(f"Log: {log}")
            
finally:
    driver.quit()
