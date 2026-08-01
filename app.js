let records = [];
let charts = {};
let firebaseReady = false;
let db, storage;

const $ = (id) => document.getElementById(id);
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value).trim().replaceAll('.', '-').replaceAll('/', '-');
  const parts = s.split('-');
  if (parts.length === 3) {
    const [d,m,y] = parts.map(Number);
    if (y > 1900) return new Date(y, m-1, d);
  }
  const dt = new Date(value);
  return isNaN(dt) ? null : dt;
};
const fmtDate = (v) => v || '';
const daysToDue = (due) => {
  const d = parseDate(due);
  if (!d) return 99999;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((d - today) / (1000*60*60*24));
};
const statusOf = (r) => {
  const d = daysToDue(r.dueDate);
  if (d < 0) return 'Expired';
  if (d <= 30) return 'Due30';
  if (d <= 60) return 'Due60';
  return 'Valid';
};
const statusLabel = (s) => s === 'Due30' ? 'Due 30' : s === 'Due60' ? 'Due 60' : s;

async function initFirebaseIfEnabled() {
  if (!window.useFirebase || !window.firebaseConfig || !window.firebaseConfig.apiKey) return;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js');
  const { getFirestore, collection, getDocs, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js');
  const app = initializeApp(window.firebaseConfig);
  db = getFirestore(app); storage = getStorage(app);
  window.fb = { collection, getDocs, doc, setDoc, ref, uploadBytes, getDownloadURL };
  firebaseReady = true;
  $('syncMode').innerText = 'Firebase Mode';
}

function normalizeRow(row) {
  const get = (...keys) => keys.map(k => row[k]).find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';
  const area = get('Line','line','Area','area');
  const machineNo = get('Machine No','Machine No ','machineNo','Machine');
  const gaugeId = get('Gauge Sl No','Gauge Sl No ','Gauge ID','gaugeId');
  const certificateNo = get('File Name','Certificate no','Certificate No','certificateNo');
  const gaugeDescription = get('Certificate no','Location','Location ','Description','gaugeDescription');
  return {
    id: `${machineNo}-${gaugeId}-${Math.random().toString(36).slice(2,8)}`,
    area, machineNo, gaugeId, certificateNo, gaugeDescription,
    range: get('Location ','Range','range'),
    workRange: get('Range','Work Range','workRange'),
    lc: get('Work Range','L C','LC','lc'),
    errorPercent: get('Error %','errorPercent'),
    calibrationDate: get('Calibration done on','calibrationDate'),
    dueDate: get('Due date','dueDate'),
    certificateUrl: get('Certificate URL','certificateUrl'),
    certificateFileName: ''
  };
}

async function saveLocal() { localStorage.setItem('calibrationRecords', JSON.stringify(records)); }
async function loadLocal() { records = JSON.parse(localStorage.getItem('calibrationRecords') || '[]'); }
async function saveFirebaseAll() {
  if (!firebaseReady) return;
  const { doc, setDoc } = window.fb;
  await Promise.all(records.map(r => setDoc(doc(db, 'calibrationRecords', r.id), r)));
}
async function loadFirebase() {
  if (!firebaseReady) return;
  const { collection, getDocs } = window.fb;
  const snap = await getDocs(collection(db,'calibrationRecords'));
  records = snap.docs.map(d => d.data());
}

async function readWorkbook(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type:'array', cellDates:false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval:'' });
  records = json.map(normalizeRow).filter(r => r.machineNo && r.gaugeId);
  await saveLocal(); await saveFirebaseAll(); renderAll();
}

async function loadSample() {
  const res = await fetch('data/sample-calibration-data.json');
  records = await res.json();
  await saveLocal(); await saveFirebaseAll(); renderAll();
}

function filteredRecords() {
  const q = $('searchInput').value.toLowerCase();
  const area = $('areaFilter').value;
  const machine = $('machineFilter').value;
  const status = $('statusFilter').value;
  return records.filter(r => {
    const hay = [r.area,r.machineNo,r.gaugeId,r.certificateNo,r.gaugeDescription].join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (!area || r.area === area) && (!machine || r.machineNo === machine) && (!status || statusLabel(statusOf(r)) === status);
  });
}

function renderFilters() {
  const areas = [...new Set(records.map(r=>r.area).filter(Boolean))].sort();
  const machines = [...new Set(records.map(r=>r.machineNo).filter(Boolean))].sort();
  $('areaFilter').innerHTML = '<option value="">All Areas</option>' + areas.map(a=>`<option>${a}</option>`).join('');
  $('machineFilter').innerHTML = '<option value="">All Machines</option>' + machines.map(m=>`<option>${m}</option>`).join('');
}
function renderKPIs(list) {
  const counts = {Valid:0, Due30:0, Due60:0, Expired:0};
  list.forEach(r => counts[statusOf(r)]++);
  $('kpiTotal').innerText = list.length;
  $('kpiValid').innerText = counts.Valid;
  $('kpiDue30').innerText = counts.Due30;
  $('kpiDue60').innerText = counts.Due60;
  $('kpiExpired').innerText = counts.Expired;
  $('kpiCompliance').innerText = list.length ? Math.round((counts.Valid + counts.Due30 + counts.Due60) / list.length * 100) + '%' : '0%';
}
function renderTable(list) {
  $('calTableBody').innerHTML = list.map((r,i) => {
    const st = statusOf(r);
    const cert = r.certificateUrl ? `<a class="cert-link" href="${r.certificateUrl}" target="_blank">View</a>` : `<label class="button file-btn">Upload<input type="file" hidden data-row="${records.indexOf(r)}" class="certUpload" accept=".pdf,.png,.jpg,.jpeg" /></label>`;
    return `<tr><td>${r.area}</td><td>${r.machineNo}</td><td>${r.gaugeId}</td><td>${r.certificateNo}</td><td>${r.gaugeDescription}</td><td>${r.range}</td><td>${fmtDate(r.calibrationDate)}</td><td>${fmtDate(r.dueDate)}</td><td><span class="badge ${st}">${statusLabel(st)}</span></td><td>${cert}</td></tr>`;
  }).join('');
  document.querySelectorAll('.certUpload').forEach(inp => inp.addEventListener('change', handleCertificate));
}
function chart(id, type, labels, data, colors) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart($(id), { type, data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } } });
}
function renderCharts(list) {
  const areaCounts = {}; list.forEach(r => areaCounts[r.area || 'Blank'] = (areaCounts[r.area || 'Blank']||0)+1);
  chart('areaChart','doughnut',Object.keys(areaCounts),Object.values(areaCounts),['#0b63b6','#0b8f42','#f47c20','#d72b2b','#7b61ff']);
  const st = {Valid:0, Due30:0, Due60:0, Expired:0}; list.forEach(r=>st[statusOf(r)]++);
  chart('statusChart','doughnut',['Valid','Due 30','Due 60','Expired'],[st.Valid,st.Due30,st.Due60,st.Expired],['#0b8f42','#f7b500','#f47c20','#d72b2b']);
  const monthly = {}; list.forEach(r => { const d=parseDate(r.dueDate); if(d){ const k=d.toLocaleString('en',{month:'short',year:'2-digit'}); monthly[k]=(monthly[k]||0)+1; }});
  if (charts.dueTrendChart) charts.dueTrendChart.destroy();
  charts.dueTrendChart = new Chart($('dueTrendChart'), { type:'bar', data:{labels:Object.keys(monthly), datasets:[{label:'Due Count',data:Object.values(monthly),backgroundColor:'#0b63b6'}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}} });
}
function renderAll() { const list = filteredRecords(); renderFilters(); renderKPIs(list); renderTable(list); renderCharts(list); }

async function handleCertificate(e) {
  const file = e.target.files[0]; if(!file) return;
  const idx = Number(e.target.dataset.row); const r = records[idx];
  if (firebaseReady) {
    const { ref, uploadBytes, getDownloadURL, doc, setDoc } = window.fb;
    const fileRef = ref(storage, `calibration-certificates/${r.machineNo}/${r.gaugeId}/${file.name}`);
    await uploadBytes(fileRef, file);
    r.certificateUrl = await getDownloadURL(fileRef);
  } else {
    r.certificateFileName = file.name;
    r.certificateUrl = URL.createObjectURL(file);
  }
  await saveLocal(); if(firebaseReady) await saveFirebaseAll(); renderAll();
}
function exportCSV() {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Calibration');
  XLSX.writeFile(wb, 'calibration_export.xlsx');
}
function bindEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active'); $(btn.dataset.tab).classList.add('active');
    $('pageTitle').innerText = btn.textContent.trim();
  }));
  $('excelUpload').addEventListener('change', e => e.target.files[0] && readWorkbook(e.target.files[0]));
  $('loadSampleBtn').addEventListener('click', loadSample);
  $('exportBtn').addEventListener('click', exportCSV);
  ['searchInput','areaFilter','machineFilter','statusFilter'].forEach(id => $(id).addEventListener('input', () => { renderKPIs(filteredRecords()); renderTable(filteredRecords()); renderCharts(filteredRecords()); }));
}
(async function start(){ bindEvents(); await initFirebaseIfEnabled(); if(firebaseReady) await loadFirebase(); else await loadLocal(); if(!records.length) await loadSample(); else renderAll(); })();
