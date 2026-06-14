// ===== WEALTH PROJECTION MODULE =====

function formatInt(n) {
  const sym = STATE.settings?.currency || '₹';
  return sym + Math.round(n).toLocaleString('en-IN');
}

function renderProjection() {
  // Default values
  let initCapital = 10000;
  let monthlyCont = 1000;
  let rate = 8;
  let years = 10;

  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title"><i data-lucide="trending-up"></i> Wealth Projection</h1>
          <p class="page-subtitle">Simulate compound growth and visualize your future wealth</p>
        </div>
      </div>

      <!-- Sliders Card -->
      <div class="glass-card" style="padding:24px;margin-bottom:20px">
        <div style="display:flex;flex-direction:column;gap:20px">
          
          <!-- Initial Capital -->
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center">
              <span style="font-weight:600;font-size:14px;color:var(--text2)">Initial Capital</span>
              <span id="val-init" style="font-weight:700;color:var(--teal)">₹10,000</span>
            </div>
            <input type="range" id="slide-init" min="0" max="1000000" step="5000" value="${initCapital}" style="width:100%;cursor:pointer"/>
          </div>

          <!-- Monthly Contribution -->
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center">
              <span style="font-weight:600;font-size:14px;color:var(--text2)">Monthly Contribution</span>
              <span id="val-monthly" style="font-weight:700;color:var(--teal)">₹1,000/mo</span>
            </div>
            <input type="range" id="slide-monthly" min="0" max="100000" step="500" value="${monthlyCont}" style="width:100%;cursor:pointer"/>
          </div>

          <!-- Annual Interest Rate -->
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center">
              <span style="font-weight:600;font-size:14px;color:var(--text2)">Expected Annual Return (p.a.)</span>
              <span id="val-rate" style="font-weight:700;color:var(--teal)">8.0%</span>
            </div>
            <input type="range" id="slide-rate" min="1" max="30" step="0.5" value="${rate}" style="width:100%;cursor:pointer"/>
          </div>

          <!-- Investment Period -->
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center">
              <span style="font-weight:600;font-size:14px;color:var(--text2)">Investment Period</span>
              <span id="val-years" style="font-weight:700;color:var(--teal)">10 Years</span>
            </div>
            <input type="range" id="slide-years" min="1" max="40" step="1" value="${years}" style="width:100%;cursor:pointer"/>
          </div>

        </div>
      </div>

      <!-- Metrics Summary Card Grid -->
      <div class="stat-grid" style="margin-bottom:20px;display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px">
        <div class="stat-card bg-indigo" style="padding:20px;border-radius:16px">
          <span class="stat-card-icon">💰</span>
          <div class="stat-card-value" id="card-invested" style="font-size:24px;font-weight:800">₹0</div>
          <div class="stat-card-label" style="font-size:12px;color:var(--text2)">Total Invested</div>
        </div>
        <div class="stat-card bg-teal" style="padding:20px;border-radius:16px">
          <span class="stat-card-icon">📈</span>
          <div class="stat-card-value" id="card-future" style="font-size:24px;font-weight:800;color:var(--teal)">₹0</div>
          <div class="stat-card-label" style="font-size:12px;color:var(--text2)">Future Value</div>
        </div>
        <div class="stat-card bg-amber" style="padding:20px;border-radius:16px">
          <span class="stat-card-icon">⚡</span>
          <div class="stat-card-value" id="card-interest" style="font-size:24px;font-weight:800;color:var(--amber)">₹0</div>
          <div class="stat-card-label" style="font-size:12px;color:var(--text2)">Interest Earned</div>
        </div>
      </div>

      <!-- Chart Panel -->
      <div class="glass-card" style="padding:24px;margin-bottom:20px">
        <p class="section-title" style="font-size:16px;margin-bottom:16px;display:flex;align-items:center;gap:8px"><i data-lucide="bar-chart-3"></i> Growth Trajectory</p>
        <div class="chart-container" style="height:320px;position:relative;width:100%">
          <canvas id="projection-canvas"></canvas>
        </div>
      </div>

    </div>
  `;

  // Grab controls
  const slideInit = document.getElementById('slide-init');
  const slideMonthly = document.getElementById('slide-monthly');
  const slideRate = document.getElementById('slide-rate');
  const slideYears = document.getElementById('slide-years');

  const updateSimulation = () => {
    const p = parseFloat(slideInit.value) || 0;
    const pmt = parseFloat(slideMonthly.value) || 0;
    const r = (parseFloat(slideRate.value) || 0) / 100;
    const t = parseInt(slideYears.value) || 1;

    // Display values
    document.getElementById('val-init').textContent = formatInt(p);
    document.getElementById('val-monthly').textContent = formatInt(pmt) + '/mo';
    document.getElementById('val-rate').textContent = (r * 100).toFixed(1) + '%';
    document.getElementById('val-years').textContent = t + (t === 1 ? ' Year' : ' Years');

    // Run compound interest month by month
    const labels = ['Year 0'];
    const investedData = [Math.round(p)];
    const compoundedData = [Math.round(p)];

    let balance = p;
    let totalInvested = p;
    const monthlyRate = r / 12;

    for (let yr = 1; yr <= t; yr++) {
      for (let m = 1; m <= 12; m++) {
        balance = balance * (1 + monthlyRate) + pmt;
        totalInvested += pmt;
      }
      labels.push('Yr ' + yr);
      investedData.push(Math.round(totalInvested));
      compoundedData.push(Math.round(balance));
    }

    const finalFuture = compoundedData[compoundedData.length - 1];
    const finalInvested = investedData[investedData.length - 1];
    const finalInterest = Math.max(0, finalFuture - finalInvested);

    // Update KPI metrics
    document.getElementById('card-invested').textContent = formatInt(finalInvested);
    document.getElementById('card-future').textContent = formatInt(finalFuture);
    document.getElementById('card-interest').textContent = formatInt(finalInterest);

    // Update chart visualization
    drawProjectionChart(labels, investedData, compoundedData);
  };

  // Set up slide bindings
  slideInit.addEventListener('input', updateSimulation);
  slideMonthly.addEventListener('input', updateSimulation);
  slideRate.addEventListener('input', updateSimulation);
  slideYears.addEventListener('input', updateSimulation);

  // Initial draw
  updateSimulation();

  // Re-process Lucide icons
  if (window.lucide && lucide.createIcons) {
    try { lucide.createIcons(); } catch (_) {}
  }
}

function drawProjectionChart(labels, invested, compounded) {
  const ctx = document.getElementById('projection-canvas')?.getContext('2d');
  if (!ctx) return;

  // Clean up any existing projection chart instance using LifeOS global registry
  if (chartInstances.projection) {
    try { chartInstances.projection.destroy(); } catch (_) {}
  }

  const isLight = document.body.classList.contains('light');
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const textColor = isLight ? '#475569' : 'rgba(241,245,249,0.6)';

  chartInstances.projection = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Compounded Wealth',
          data: compounded,
          borderColor: '#00c9a7',
          backgroundColor: 'rgba(0, 201, 167, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Total Invested',
          data: invested,
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          tension: 0.1,
          borderWidth: 2.5,
          pointRadius: 2,
          pointHoverRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: textColor,
            font: { family: 'Inter', size: 12, weight: 600 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatInt(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 11 },
            callback: function(value) {
              const sym = STATE.settings?.currency || '₹';
              if (value >= 10000000) return sym + (value / 10000000).toFixed(1) + 'Cr';
              if (value >= 100000) return sym + (value / 100000).toFixed(1) + 'L';
              if (value >= 1000) return sym + (value / 1000).toFixed(0) + 'k';
              return sym + value;
            }
          }
        }
      }
    }
  });
}
