function showReport(type) {
    let reportText = '';
    switch(type) {
        case 'daily':
            reportText = 'Daily report: 25 strays spotted today.';
            break;
        case 'weekly':
            reportText = 'Weekly report: 150 strays spotted this week.';
            break;
        case 'monthly':
            reportText = 'Monthly report: 600 strays spotted this month.';
            break;
    }
    document.getElementById('report-text').innerText = reportText;
    document.getElementById('report-popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('report-popup').style.display = 'none';
}

function goToReport() {
    window.location.href = 'report.html'; // Replace with the actual report page URL
}