function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h,i) => obj[h] = cells[i] ?? '');
    return obj;
  });
  return { headers, rows };
}

async function loadDataset(which){
  let path, title;

  if(which === 'ghana'){
    path = 'data/hemoglobin_ghana_clean.csv';
    title = 'Ghana — Hemoglobin Dataset';
  } else if(which === 'ensenada'){
    path = 'data/ensenada_mexico_hemoglobin_full.csv';
    title = 'Ensenada, Mexico — Hemoglobin Dataset';
  } else { // india
    path = 'data/India_data_2023_clean.csv';
    title = 'India (2023) — Hemoglobin Dataset';
  }

  const resp = await fetch(path);
  if(!resp.ok) throw new Error('Failed to fetch ' + path);
  const text = await resp.text();
  const { headers, rows } = parseCSV(text);

  document.getElementById('title').textContent = title;

  rows.forEach(r => {
    if(r.age !== undefined) r.age = r.age === '' ? null : Number(r.age);
    if(r.hemoglobin !== undefined) r.hemoglobin = r.hemoglobin === '' ? null : Number(r.hemoglobin);
  });

  const filtered = rows.filter(r => r.age != null && r.hemoglobin != null);

  Plotly.newPlot(
    'scatter',
    [{
      x: filtered.map(r => r.age),
      y: filtered.map(r => r.hemoglobin),
      mode: 'markers',
      type: 'scatter',
      hovertemplate: 'Age %{x}<br>Hb %{y}<extra></extra>'
    }],
    { margin:{t:10}, xaxis:{title:'Age (years)'}, yaxis:{title:'Hemoglobin (g/dL)'} }
  );

  const hbs = rows.map(r => r.hemoglobin).filter(v => v != null && !Number.isNaN(v));
  Plotly.newPlot(
    'hist',
    [{ x: hbs, type: 'histogram', nbinsx: 20, hovertemplate: 'Hb %{x}<extra></extra>' }],
    { margin:{t:10}, xaxis:{title:'Hemoglobin (g/dL)'}, yaxis:{title:'Count'} }
  );

  const sexes = Array.from(new Set(rows.map(r => r.sex).filter(Boolean)));
  const boxData = sexes.map(s => ({
    y: rows.filter(r => r.sex === s && r.hemoglobin != null).map(r => r.hemoglobin),
    name: s,
    type: 'box'
  }));
  Plotly.newPlot('box', boxData, { margin:{t:10}, yaxis:{title:'Hemoglobin (g/dL)'} });

  const table = document.getElementById('table');
  table.innerHTML = '';
  const tbl = document.createElement('table');

  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.slice(0,100).forEach(r => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      let val = r[h];
      if(val === null || val === undefined || val === '') val = 'null';
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  table.appendChild(tbl);
}

async function init(){
  // If Ensenada file missing, remove option
  try{
    const res = await fetch('data/ensenada_mexico_hemoglobin_full.csv', { method:'HEAD' });
    if(!res.ok) throw 0;
  }catch(e){
    const opt = document.querySelector('#dataset option[value="ensenada"]');
    if(opt) opt.remove();
  }

  // If India file missing, remove option
  try{
    const res = await fetch('data/India_data_2023_clean.csv', { method:'HEAD' });
    if(!res.ok) throw 0;
  }catch(e){
    const opt = document.querySelector('#dataset option[value="india"]');
    if(opt) opt.remove();
  }

  const sel = document.getElementById('dataset');
  document.getElementById('reload').addEventListener('click', () => loadDataset(sel.value));
  await loadDataset(sel.value);
}

init();
