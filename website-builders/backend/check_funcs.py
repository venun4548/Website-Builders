with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()
    print(f'openAssignStaffModal count: {content.count("function openAssignStaffModal")}')
    print(f'viewEnquiryDetails count: {content.count("function viewEnquiryDetails")}')
    print(f'openConvertEnquiryModal count: {content.count("function openConvertEnquiryModal")}')
