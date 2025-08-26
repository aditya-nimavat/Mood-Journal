document.addEventListener('DOMContentLoaded', () => {

    // --- 1. FIREBASE SETUP ---
    // PASTE YOUR FIREBASE CONFIG OBJECT HERE
  const firebaseConfig = {
    apiKey: "AIzaSyCWOXIiag2S6fyuQB_ndO8LA8NAmXwPp6A",
    authDomain: "clinical-mood.firebaseapp.com",
    projectId: "clinical-mood",
    storageBucket: "clinical-mood.firebasestorage.app",
    messagingSenderId: "46969536685",
    appId: "1:46969536685:web:63aa3864a2a9d837c50624",
    measurementId: "G-XPZLC19SRV"
  };

    // Initialize Firebase
  
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser;

    // --- 2. AUTHENTICATION GUARD ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            init(); // Initialize the main app after user is confirmed
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- 3. APPLICATION LOGIC ---
    
    // --- DOM Elements ---
    const visualCards = document.querySelectorAll('.visual-card');
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const selectedDateEl = document.getElementById('selectedDate');
    const moodOptionsContainer = document.getElementById('moodOptions');
    const colorPieContainer = document.getElementById('colorPieContainer');
    const medsTakenCheckbox = document.getElementById('medsTakenCheckbox');
    const saveBtn = document.getElementById('saveBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- Data & State ---
    const moodData = [ { mood: 10, emoji: 'Very Very Happy' }, { mood: 9, emoji: 'Very Happy' }, { mood: 8, emoji: 'Happy' }, { mood: 7, emoji: 'Mild Happy' }, { mood: 6, emoji: 'Little Happy' }, { mood: 5, emoji: 'Normal' }, { mood: 4, emoji: 'Little sad' }, { mood: 3, emoji: 'Mild Sad' }, { mood: 2, emoji: 'Sad' }, { mood: 1, emoji: 'Very sad' }];
    const colors = ['#0d47a1', '#1565c0', '#1e88e5', '#2e7d32', '#388e3c', '#43a047', '#66bb6a', '#fdd835', '#ffeb3b', '#fff176', '#ef6c00', '#f57c00', '#fb8c00', '#d32f2f', '#e53935', '#f44336'];
    const colorMoodMapping = { '#0d47a1': { range: [1, 2] }, '#1565c0': { range: [1, 2] }, '#1e88e5': { range: [1, 2] }, '#2e7d32': { range: [3, 5] }, '#388e3c': { range: [3, 5] }, '#43a047': { range: [3, 5] }, '#66bb6a': { range: [3, 5] }, '#fdd835': { range: [6, 7] }, '#ffeb3b': { range: [6, 7] }, '#fff176': { range: [6, 7] }, '#ef6c00': { range: [8, 9] }, '#f57c00': { range: [8, 9] }, '#fb8c00': { range: [8, 9] }, '#d32f2f': { range: [10, 10] }, '#e53935': { range: [10, 10] }, '#f44336': { range: [10, 10] } };
    const moodScaleColors = { '10': '#ff0000', '9': '#ff4400', '8': '#ff8400', '7': '#ffc800', '6': '#fffb00', '5': '#a2d93b', '4': '#00ff40', '3': '#00ffa6', '2': '#6f6cff', '1': '#1e00ff' };
    
    let currentDate = new Date();
    let dailyLog = { date: null, mood: null, color: null, tookMeds: false };
    let moodChart = null;
    let colorTrendChart = null;
    let masterLog = {};
    const scroller = scrollama();

    // --- Data Handling ---
    async function loadUserData() {
        if (!currentUser) return;
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('moodLog').get();
        const userData = {};
        snapshot.forEach(doc => { userData[doc.id] = doc.data(); });
        masterLog = userData;
        renderCalendar();
    }

    async function saveEntryToFirestore() {
        if (!dailyLog.date || !currentUser) return;
        await db.collection('users').doc(currentUser.uid).collection('moodLog').doc(dailyLog.date).set(dailyLog);
    }

    // --- Initialization ---
    const init = () => {
        loadUserData();
        populateMoods();
        generateColorPie();
        setupScrollama();
        attachEventListeners();
    };

    // --- UI Generation ---
    const populateMoods = () => {
        moodOptionsContainer.innerHTML = '';
        moodData.forEach(item => {
            const moodEl = document.createElement('div');
            moodEl.classList.add('mood');
            moodEl.dataset.mood = item.mood;
            moodEl.textContent = item.emoji;
            moodOptionsContainer.appendChild(moodEl);
        });
    };

    const generateColorPie = () => {
        const size = 300; const radius = size / 2; const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', `0 0 ${size} ${size}`); const numSlices = colors.length; const sliceAngle = 360 / numSlices; const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => { const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0; return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) }; }; const describeArc = (x, y, radius, startAngle, endAngle) => { const start = polarToCartesian(x, y, radius, endAngle); const end = polarToCartesian(x, y, radius, startAngle); const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; return `M ${x},${y} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag} 0 ${end.x},${end.y} Z`; }; for (let i = 0; i < numSlices; i++) { const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', describeArc(radius, radius, radius, i * sliceAngle, (i + 1) * sliceAngle)); path.setAttribute('fill', colors[i]); path.classList.add('color-slice'); path.dataset.color = colors[i]; svg.appendChild(path); } colorPieContainer.appendChild(svg);
    };

    // --- Calendar & Chart Rendering ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = ''; const month = currentDate.getMonth(); const year = currentDate.getFullYear(); currentMonthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`; const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => { const weekdayEl = document.createElement('div'); weekdayEl.classList.add('weekday'); weekdayEl.textContent = day; calendarGrid.appendChild(weekdayEl); }); for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.appendChild(document.createElement('div')); for (let day = 1; day <= daysInMonth; day++) { const dayCell = document.createElement('div'); dayCell.classList.add('day'); const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; dayCell.dataset.date = dateStr; let dayContent = `<span>${day}</span>`; if (masterLog[dateStr]) { dayCell.dataset.mood = masterLog[dateStr].mood; if (masterLog[dateStr].color) { dayContent += `<div class="mood-dot" style="background-color: ${masterLog[dateStr].color};"></div>`; } } dayCell.innerHTML = dayContent; dayCell.addEventListener('click', () => { dailyLog.date = dateStr; selectedDateEl.textContent = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); document.querySelectorAll('.day').forEach(d => d.classList.remove('selected')); dayCell.classList.add('selected'); }); calendarGrid.appendChild(dayCell); } renderCharts();
    };

    const externalTooltipHandler = (context) => {
        const { chart, tooltip } = context; let tooltipEl = document.getElementById('custom-tooltip'); if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; return; } if (tooltip.body) { const titleLines = tooltip.title || []; const tooltipBody = tooltipEl.querySelector('.tooltip-body'); tooltipBody.innerHTML = ''; const titleEl = document.createElement('span'); titleEl.className = 'tooltip-title'; titleLines.forEach(title => { titleEl.appendChild(document.createTextNode(title)); }); tooltipBody.appendChild(titleEl); const dataIndex = tooltip.dataPoints[0].dataIndex; const sortedDates = Object.keys(masterLog).sort(); const dateStr = sortedDates[dataIndex]; const logEntry = masterLog[dateStr]; if (logEntry) { const moodColor = moodScaleColors[logEntry.mood] || '#cccccc'; const moodHtml = `<div class="tooltip-line"><span class="tooltip-swatch" style="background-color: ${moodColor}"></span>Mood</div>`; const userColor = logEntry.color; const userColorHtml = `<div class="tooltip-line"><span class="tooltip-swatch" style="background-color: ${userColor}"></span>Color Wheel</div>`; tooltipBody.innerHTML += moodHtml + userColorHtml; } } const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas; tooltipEl.style.opacity = 1; tooltipEl.style.left = positionX + tooltip.caretX + 'px'; tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    };

    const renderCharts = () => {
        const sortedDates = Object.keys(masterLog).sort(); const labels = sortedDates.map(date => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })); const moodData = sortedDates.map(date => masterLog[date].mood); const moodCtx = document.getElementById('moodChart').getContext('2d'); if (moodChart) moodChart.destroy(); moodChart = new Chart(moodCtx, { type: 'line', data: { labels, datasets: [{ label: 'Mood', data: moodData, borderColor: 'var(--primary-color)', backgroundColor: 'rgba(94, 114, 228, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } }, interaction: { intersect: false, mode: 'index', }, plugins: { legend: { display: false }, tooltip: { enabled: false, external: externalTooltipHandler } } } }); const colorData = sortedDates.map(date => masterLog[date].color).filter(Boolean); const colorCtx = document.getElementById('colorTrendChart').getContext('2d'); if (colorTrendChart) colorTrendChart.destroy(); if (colorData.length < 2) { if(colorTrendChart) colorTrendChart.destroy(); colorCtx.clearRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height); if (colorData.length === 1) { colorCtx.fillStyle = colorData[0]; colorCtx.fillRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height); } return; } const gradient = colorCtx.createLinearGradient(0, 0, colorCtx.canvas.clientWidth, 0); colorData.forEach((color, index) => gradient.addColorStop(index / (colorData.length - 1), color)); colorTrendChart = new Chart(colorCtx, { type: 'line', data: { labels, datasets: [{ label: 'Color', data: labels.map(() => 5), backgroundColor: gradient, borderColor: 'transparent', fill: true, pointRadius: 0 }] }, options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } }, responsive: true, maintainAspectRatio: false } });
    };

    // --- Scrollytelling & Event Handlers ---
    const setupScrollama = () => {
        scroller.setup({ step: '.scrolling-steps .step', offset: 0.6, debug: false, }).onStepEnter((response) => { response.element.classList.add('is-active'); const visual = response.element.dataset.triggerVisual; if (visual) { visualCards.forEach(card => card.classList.remove('active-visual')); document.querySelector(`.visual-card[data-visual="${visual}"]`).classList.add('active-visual'); } else { visualCards.forEach(card => card.classList.remove('active-visual')); document.querySelector('.visual-card[data-visual="calendar"]').classList.add('active-visual'); } }).onStepExit((response) => { response.element.classList.remove('is-active'); });
    };

    const handleSave = async () => {
        if (!dailyLog.date || !dailyLog.mood || !dailyLog.color) {
            alert('Please ensure you have selected a date, mood, and color before saving.');
            return;
        }
        const moodNum = parseInt(dailyLog.mood, 10); const colorInfo = colorMoodMapping[dailyLog.color]; let proceed = true; if (colorInfo) { const [minMood, maxMood] = colorInfo.range; if (moodNum < (minMood - 1) || moodNum > (maxMood + 1)) { proceed = confirm("Clinical Note: The selected color is not typically associated with this mood. This may indicate mood incongruence. Save anyway?"); } }
        if (proceed) {
            dailyLog.tookMeds = medsTakenCheckbox.checked;
            masterLog[dailyLog.date] = { ...dailyLog };
            await saveEntryToFirestore();
            renderCalendar();
            saveBtn.textContent = 'Saved! ✔';
            setTimeout(() => { saveBtn.textContent = 'Complete & Save Entry' }, 2000);
        }
    };

    const handleLogout = () => {
        auth.signOut().catch((error) => console.error("Sign out error:", error));
    };

    const attachEventListeners = () => {
        prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
        moodOptionsContainer.addEventListener('click', (e) => { const target = e.target.closest('.mood'); if (target) { dailyLog.mood = target.dataset.mood; document.querySelectorAll('.mood').forEach(m => m.classList.remove('selected')); target.classList.add('selected'); } });
        colorPieContainer.addEventListener('click', (e) => { const target = e.target.closest('.color-slice'); if (target) { dailyLog.color = target.dataset.color; document.querySelectorAll('.color-slice').forEach(s => s.classList.remove('selected')); target.classList.add('selected'); } });
        saveBtn.addEventListener('click', handleSave);
        logoutBtn.addEventListener('click', handleLogout);
    };

});
