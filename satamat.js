'use strict';
(function () {
  const MONTHS = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];
  const AREA_ORDER = ['OR', 'VS', 'NS', 'MUU'];
  const TYPE_ORDER = ['70', '40', '50', '60', '80', '81', '82', '83', '93', '91', '90', '10', '94', '95', '97'];
  const AREA_COLORS = {OR: '#c45a2d', VS: '#277987', NS: '#8a7045', MUU: '#8b8b88'};
  const TYPE_COLORS = {
    '70': '#315a78', '40': '#bf5636', '50': '#d29a2c', '60': '#72854d',
    '80': '#655991', '81': '#a73846', '82': '#338f9c', '83': '#9772a5',
    '93': '#b58537', '91': '#62666d', '90': '#a18b80', '10': '#4f9a75',
    '94': '#8b7935', '95': '#775d38', '97': '#a7a7a7'
  };
  let data;
  let partialMonth;
  let selectedMonth;
  const $ = id => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const monthKey = (year, month) => String(year) + '-' + String(month).padStart(2, '0');
  const fullMonthName = key => MONTHS[Number(key.slice(5)) - 1] + 'kuu ' + key.slice(0, 4);
  const labelFor = (group, key) => group === 'area' ? data.areas[key] : data.types[key];
  const colorFor = (group, key) => group === 'area' ? AREA_COLORS[key] : TYPE_COLORS[key];
  const filteredRows = key => data.months.filter(row => row.month === key && ($('area-select').value === 'ALL' || row.area === $('area-select').value) && ($('type-select').value === 'ALL' || row.type === $('type-select').value));
  const totalFor = key => filteredRows(key).reduce((sum, row) => sum + row.count, 0);
  const isUnavailable = key => key < '2018-10' || key > partialMonth;
  const pretty = number => new Intl.NumberFormat('fi-FI').format(number);

  function fillControls() {
    const years = [...new Set(data.months.map(row => row.month.slice(0, 4)))].filter(year => Number(year) >= 2019).sort();
    years.forEach(year => {
      const option = el('option', '', year);
      option.value = year;
      $('year-select').append(option);
    });
    $('year-select').value = years.includes('2025') ? '2025' : years[years.length - 1];
    [{value: 'ALL', text: 'Kaikki satamat'}, ...AREA_ORDER.map(code => ({value: code, text: data.areas[code]}))].forEach(item => {
      const option = el('option', '', item.text); option.value = item.value; $('area-select').append(option);
    });
    [{value: 'ALL', text: 'Kaikki alustyypit'}, ...TYPE_ORDER.filter(code => data.months.some(row => row.type === code)).map(code => ({value: code, text: data.types[code]}))].forEach(item => {
      const option = el('option', '', item.text); option.value = item.value; $('type-select').append(option);
    });
    ['year-select', 'area-select', 'type-select', 'group-select'].forEach(id => $(id).addEventListener('change', () => {
      selectedMonth = null;
      render();
    }));
  }

  function selectionText() {
    const area = $('area-select').value === 'ALL' ? 'kaikki satamat' : data.areas[$('area-select').value];
    const type = $('type-select').value === 'ALL' ? 'kaikki alustyypit' : data.types[$('type-select').value];
    return area + ' · ' + type;
  }

  function showMonth(key) {
    selectedMonth = key;
    const rows = filteredRows(key);
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const group = $('group-select').value;
    const grouped = new Map();
    rows.forEach(row => {
      const code = row[group];
      grouped.set(code, (grouped.get(code) || 0) + row.count);
    });
    const details = [...grouped].sort((a, b) => b[1] - a[1]).map(([code, count]) => labelFor(group, code) + ' ' + pretty(count));
    $('month-detail').textContent = fullMonthName(key) + ': ' + pretty(total) + ' käyntiä' + (key === partialMonth ? ' (keskeneräinen kuukausi)' : '') + '. ' + (details.length ? details.join(' · ') + '.' : 'Ei käyntejä valitulla rajauksella.');
    document.querySelectorAll('.month-bar,.heat-cell').forEach(node => node.classList.toggle('is-selected', node.dataset.month === key));
  }

  function renderMonthly() {
    const year = Number($('year-select').value);
    const group = $('group-select').value;
    const chart = $('monthly-chart');
    chart.replaceChildren();
    const totals = Array.from({length: 12}, (_, index) => totalFor(monthKey(year, index + 1)));
    const max = Math.max(10, ...totals);
    const chartHeight = 235;
    [0, 0.5, 1].forEach(fraction => {
      const line = el('div', 'gridline');
      line.style.bottom = (32 + fraction * chartHeight) + 'px';
      line.append(el('span', '', pretty(Math.round(max * fraction))));
      chart.append(line);
    });
    const activeKeys = new Set();
    for (let month = 1; month <= 12; month++) {
      const key = monthKey(year, month);
      const column = el('div', 'month-column');
      const label = el('span', 'month-label', MONTHS[month - 1]);
      column.append(label);
      if (isUnavailable(key)) {
        column.append(el('span', 'bar-unavailable', '—'));
        chart.append(column);
        continue;
      }
      const rows = filteredRows(key);
      const grouped = new Map();
      rows.forEach(row => {
        grouped.set(row[group], (grouped.get(row[group]) || 0) + row.count);
      });
      const total = totals[month - 1];
      const bar = el('button', 'month-bar' + (key === partialMonth ? ' is-partial' : ''));
      bar.type = 'button';
      bar.dataset.month = key;
      bar.style.height = Math.max(2, total / max * chartHeight) + 'px';
      bar.setAttribute('aria-label', fullMonthName(key) + ': ' + pretty(total) + ' satamakäyntiä' + (key === partialMonth ? ', kuukausi kesken' : ''));
      const order = group === 'area' ? AREA_ORDER : TYPE_ORDER;
      order.forEach(code => {
        const count = grouped.get(code) || 0;
        if (!count) return;
        activeKeys.add(code);
        const part = el('span', 'segment');
        part.style.background = colorFor(group, code) || '#888';
        part.style.height = (count / total * 100) + '%';
        part.title = labelFor(group, code) + ': ' + pretty(count);
        bar.append(part);
      });
      bar.append(el('span', 'bar-total', pretty(total)));
      bar.addEventListener('click', () => showMonth(key));
      column.append(bar);
      chart.append(column);
    }
    $('monthly-caption').textContent = 'Kuukausittaiset satamakäynnit ' + year;
    $('monthly-subtitle').textContent = selectionText() + ' · värit: ' + (group === 'area' ? 'satamat' : 'alustyypit') + (String(year) === partialMonth.slice(0, 4) ? ' · * kuluva kuukausi on kesken' : '');
    const legend = $('monthly-legend');
    legend.replaceChildren();
    (group === 'area' ? AREA_ORDER : TYPE_ORDER).filter(code => activeKeys.has(code)).forEach(code => {
      const item = el('span', 'legend-item');
      const swatch = el('span', 'swatch');
      swatch.style.background = colorFor(group, code) || '#888';
      item.append(swatch, el('span', '', labelFor(group, code)));
      legend.append(item);
    });
    if (!activeKeys.size) legend.textContent = 'Ei käyntejä valituilla rajauksilla.';
  }

  function renderHeatmap() {
    const wrap = $('heatmap-wrap');
    wrap.replaceChildren();
    const table = el('table', 'heatmap');
    table.setAttribute('aria-label', 'Satamakäynnit kuukausittain vuosina 2018–' + partialMonth.slice(0, 4));
    const head = el('thead');
    const headRow = el('tr');
    headRow.append(el('th', '', 'Vuosi'));
    MONTHS.forEach(name => headRow.append(el('th', '', name)));
    head.append(headRow); table.append(head);
    const body = el('tbody');
    const lastYear = Number(partialMonth.slice(0, 4));
    const values = [];
    for (let year = 2018; year <= lastYear; year++) for (let month = 1; month <= 12; month++) {
      const key = monthKey(year, month);
      if (!isUnavailable(key)) values.push(totalFor(key));
    }
    const max = Math.max(1, ...values);
    for (let year = 2018; year <= lastYear; year++) {
      const row = el('tr'); row.append(el('th', '', year));
      for (let month = 1; month <= 12; month++) {
        const key = monthKey(year, month);
        const cell = el('td');
        if (isUnavailable(key)) {
          const empty = el('span', 'heat-cell unavailable', '—');
          empty.title = key < '2018-10' ? 'Vuoden 2018 aineisto on tässä kuussa hajanainen' : 'Tuleva kuukausi';
          cell.append(empty);
        } else {
          const total = totalFor(key);
          const level = total === 0 ? 0 : Math.max(1, Math.min(5, Math.ceil(total / max * 5)));
          const button = el('button', 'heat-cell level-' + level + (key === partialMonth ? ' partial' : ''), total);
          button.type = 'button'; button.dataset.month = key;
          button.title = fullMonthName(key) + ': ' + pretty(total) + ' käyntiä';
          button.setAttribute('aria-label', button.title + (key === partialMonth ? ', kuukausi kesken' : ''));
          button.addEventListener('click', () => {
            $('year-select').value = String(year);
            renderMonthly();
            showMonth(key);
          });
          cell.append(button);
        }
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body); wrap.append(table);
    $('heatmap-subtitle').textContent = selectionText() + ' · tummempi ruutu tarkoittaa enemmän käyntejä · asteikko 0–' + pretty(max);
  }

  function render() {
    renderMonthly();
    renderHeatmap();
    if (selectedMonth) showMonth(selectedMonth);
    else $('month-detail').textContent = 'Valitse pylväs tai lämpökartan ruutu nähdäksesi erittelyn.';
  }

  async function start() {
    try {
      const response = await fetch('data.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      data = await response.json();
      if (!data.months || !data.areas || !data.types || data.locode !== 'FIOUL') throw new Error('Virheellinen aineisto');
      partialMonth = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit'}).format(new Date(data.retrieved_at));
      const date = new Date(data.retrieved_at).toLocaleDateString('fi-FI', {timeZone: 'Europe/Helsinki', day: 'numeric', month: 'numeric', year: 'numeric'});
      $('data-date').textContent = date + ' · ' + pretty(data.visits) + ' toteutunutta saapumista';
      $('latest-year').textContent = partialMonth.slice(0, 4);
      const yearly = year => data.months.filter(row => row.month.startsWith(String(year))).reduce((sum, row) => sum + row.count, 0);
      $('kpi-2019').textContent = pretty(yearly(2019));
      $('kpi-2025').textContent = pretty(yearly(2025));
      $('kpi-change').textContent = (yearly(2025) / yearly(2019) - 1 < 0 ? '−' : '+') + Math.abs(Math.round((yearly(2025) / yearly(2019) - 1) * 100)) + ' %';
      fillControls(); render();
    } catch (error) {
      $('data-date').textContent = 'Aineistoa ei saatu ladattua';
      $('monthly-chart').textContent = 'Kaaviota ei voitu näyttää. Tarkista, että data.json on samassa hakemistossa.';
      $('heatmap-wrap').textContent = 'Lämpökarttaa ei voitu näyttää.';
      console.error(error);
    }
  }
  start();
})();
