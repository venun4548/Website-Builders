// mock
let rawEnquiryData = [{
    id: undefined,
    enquiry_id: undefined,
    status: 'NEW',
    full_name: 'Test',
    email: 'test@test.com'
}];

// Simulate what renderEnquiriesTable does
rawEnquiryData.forEach((e, index) => {
    if (!e.id && !e.enquiry_id) {
        e.id = 'TMP-' + index;
    }
});

function viewEnquiryDetails(enquiryId) {
    const enq = (rawEnquiryData || []).find(e => String(e.id) === String(enquiryId) || String(e.enquiry_id) === String(enquiryId));
    if (!enq) {
        console.log('Enquiry not found! ID: ' + enquiryId);
        return;
    }
    console.log("Found enq:", enq);
}

viewEnquiryDetails(rawEnquiryData[0].id || rawEnquiryData[0].enquiry_id);
