import React, { useEffect, useState, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
);

const VitalsChart = () => {
  const [vitals, setVitals] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [filterDays, setFilterDays] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState({
  glucose: true,
  bodyTemp: true,
  oxygen: true,
  bpSys: true,
  bpDia: true,
  weight: true,
  pain: true,
});
  const [exportScope, setExportScope] = useState('filtered');
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/vitals')
      .then((res) => res.json())
      .then((data) => {
        setVitals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filterVitals = () => {
    if (filterDays === 'all') return vitals;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(filterDays));
    return vitals.filter((v) => new Date(v.timestamp) >= cutoff);
  };

  const filteredVitals = filterVitals();

  const labels = filteredVitals.map((entry) =>
    new Date(entry.timestamp).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const alertEntries = filteredVitals
    .map((v) => {
      const alerts = [];
      if (Number(v.glucose) < 70 || Number(v.glucose) > 140) alerts.push('Abnormal Glucose');
      const [sys, dia] = (v.bp || '').split('/').map(Number);
      if (sys > 130) alerts.push('High BP Systolic');
      if (dia > 90) alerts.push('High BP Diastolic');
      if (Number(v.oxygen) < 95) alerts.push('Low Oxygen');
      if (Number(v.bodyTemp) > 38) alerts.push('High Body Temp');
      const w = Number(v.weight);
      if (v.weight !== '' && !isNaN(w) && (w < 40 || w > 120)) alerts.push('Abnormal Weight');
      if (Number(v.pain) > 7) alerts.push('High Pain/Discomfort');
      return alerts.length ? { timestamp: v.timestamp, alerts } : null;
    })
    .filter(Boolean);

  const summary = {
    glucose: filteredVitals.filter(v => Number(v.glucose) < 70 || Number(v.glucose) > 140).length,
    systolic: filteredVitals.filter(v => Number((v.bp || '').split('/')[0]) > 130).length,
    diastolic: filteredVitals.filter(v => Number((v.bp || '').split('/')[1]) > 90).length,
    oxygen: filteredVitals.filter(v => Number(v.oxygen) < 95).length,
    bodyTemp: filteredVitals.filter(v => Number(v.bodyTemp) > 38).length,
    weight: filteredVitals.filter(v => {
      const w = Number(v.weight);
      return v.weight !== '' && !isNaN(w) && (w < 40 || w > 120);
    }).length,
    pain: filteredVitals.filter(v => Number(v.pain) > 7).length,
  };

  const isAbnormal = (v) => {
    const glucose = Number(v.glucose);
    const systolic = Number(v.bp?.split('/')?.[0]);
    const diastolic = Number(v.bp?.split('/')?.[1]);
    const oxygen = Number(v.oxygen);
    const temp = Number(v.bodyTemp);
    const weight = Number(v.weight);
    const pain = Number(v.pain);
    return (
      glucose < 70 || glucose > 140 ||
      systolic > 130 ||
      diastolic > 90 ||
      oxygen < 95 ||
      temp > 38 ||
      weight < 40 || weight > 120 ||
      pain > 7
    );
  };

  const abnormalCount = filteredVitals.filter(isAbnormal).length;
  const normalCount = filteredVitals.length - abnormalCount;
  const latestTimestamp = filteredVitals[0]?.timestamp
    ? new Date(filteredVitals[0].timestamp).toLocaleString()
    : '-';

  const data = {
  labels,
  datasets: [
    selectedMetrics.glucose && {
      label: 'Glucose',
      data: filteredVitals.map((v) => Number(v.glucose) || 0),
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map((v) => {
        const g = Number(v.glucose);
        return g < 70 || g > 140 ? 'red' : 'rgba(255, 99, 132, 1)';
      }),
    },
    selectedMetrics.bodyTemp && {
      label: 'Body Temperature',
      data: filteredVitals.map((v) => Number(v.bodyTemp) || 0),
      borderColor: 'rgba(54,162,235,1)',
      backgroundColor: 'rgba(54,162,235,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map((v) => {
        const t = Number(v.bodyTemp);
        return t > 38 ? 'red' : 'rgba(54,162,235,1)';
      }),
    },
    selectedMetrics.oxygen && {
      label: 'Oxygen',
      data: filteredVitals.map((v) => Number(v.oxygen) || 0),
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map((v) => {
        const o = Number(v.oxygen);
        return o < 95 ? 'red' : 'rgba(75,192,192,1)';
      }),
    },
    selectedMetrics.bpSys && {
      label: 'BP Systolic',
      data: filteredVitals.map((v) => Number(v.bp?.split('/')?.[0]) || 0),
      borderColor: 'rgba(255,206,86,1)',
      backgroundColor: 'rgba(255,206,86,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map((v) => {
        const sys = Number(v.bp?.split('/')?.[0]);
        return sys > 130 ? 'red' : 'rgba(255,206,86,1)';
      }),
    },
    selectedMetrics.bpDia && {
      label: 'BP Diastolic',
      data: filteredVitals.map((v) => Number(v.bp?.split('/')?.[1]) || 0),
      borderColor: 'rgba(153,102,255,1)',
      backgroundColor: 'rgba(153,102,255,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map((v) => {
        const dia = Number(v.bp?.split('/')?.[1]);
        return dia > 90 ? 'red' : 'rgba(153,102,255,1)';
      }),
    },
    selectedMetrics.weight && {
      label: 'Weight',
      data: filteredVitals.map((v) => Number(v.weight) || 0),
      borderColor: 'rgba(255,159,64,1)',
      backgroundColor: 'rgba(255,159,64,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map(() => 'rgba(255,159,64,1)'),
    },
    selectedMetrics.pain && {
      label: 'Pain/Discomfort',
      data: filteredVitals.map((v) => Number(v.pain) || 0),
      borderColor: 'rgba(0,0,0,1)',
      backgroundColor: 'rgba(0,0,0,0.2)',
      tension: 0.3,
      pointBackgroundColor: filteredVitals.map(() => 'rgba(0,0,0,1)'),
    }
  ].filter(Boolean), // Remove `false` datasets
};


  const exportChartImage = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vitals_chart.png';
    a.click();
  };

  const exportChartPDF = async () => {
    if (!chartContainerRef.current) return;
    const canvas = await html2canvas(chartContainerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    pdf.text('Vitals Trend Chart', 10, 10);
    pdf.addImage(imgData, 'PNG', 10, 20, 270, 120);
    pdf.save('vitals_chart.pdf');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📈 Vitals Trend Chart</h2>

      <div style={{ marginBottom: '1rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        <strong>🩺 Vitals Summary:</strong>
        <ul style={{ marginTop: '0.5rem' }}>
          <li>Total Entries: {filteredVitals.length}</li>
          <li>Abnormal: {abnormalCount}</li>
          <li>Normal: {normalCount}</li>
          <li>Last Entry: {latestTimestamp}</li>
        </ul>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        {Object.entries(selectedMetrics).map(([key, val]) => (
          <label key={key} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={val}
              onChange={() => setSelectedMetrics((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
              {' '}
              {key === 'glucose' ? 'Glucose' :
              key === 'bodyTemp' ? 'Body Temperature' :
              key === 'oxygen' ? 'Oxygen' :
              key === 'bpSys' ? 'BP Systolic' :
              key === 'bpDia' ? 'BP Diastolic' :
              key === 'weight' ? 'Weight' : 
              key === 'pain' ? 'Pain/Discomfort' :
              key}
            </label>
          ))}
        </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setChartType('line')} style={{ backgroundColor: chartType === 'line' ? '#007bff' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px' }}>
          📉 Line Chart
        </button>
        <button onClick={() => setChartType('bar')} style={{ backgroundColor: chartType === 'bar' ? '#007bff' : '#ccc', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px' }}>
          📊 Bar Chart
        </button>
        <select onChange={(e) => setFilterDays(e.target.value)} value={filterDays} style={{ marginLeft: 'auto' }}>
          <option value="all">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
        <button onClick={exportChartImage} style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px' }}>
          🖼️ Export PNG
        </button>
        <button onClick={exportChartPDF} style={{ backgroundColor: '#6f42c1', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px' }}>
          🧾 Export PDF
        </button>
      </div>

      {loading ? (
        <p>Loading chart...</p>
      ) : (
        <>
          <div ref={chartContainerRef} style={{ maxWidth: '1000px', margin: 'auto' }}>
            {chartType === 'line' ? <Line data={data} ref={chartRef} /> : <Bar data={data} ref={chartRef} />}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>🔔 Alerts Summary</h3>
            <ul>
              {summary.glucose > 0 && <li>⚠️ {summary.glucose} abnormal glucose readings</li>}
              {summary.systolic > 0 && <li>⚠️ {summary.systolic} high systolic BP readings</li>}
              {summary.diastolic > 0 && <li>⚠️ {summary.diastolic} high diastolic BP readings</li>}
              {summary.oxygen > 0 && <li>⚠️ {summary.oxygen} low oxygen readings</li>}
              {summary.bodyTemp > 0 && <li>⚠️ {summary.bodyTemp} high temperature readings</li>}
              {summary.weight > 0 && <li>⚠️ {summary.weight} abnormal weight reading (outside 40-120kg)</li>}
              {summary.pain > 0 && <li>⚠️ {summary.pain} high pain/discomfort readings (above 7)</li>}
              {Object.values(summary).every(v => v === 0) && <li>✅ All vitals within normal range</li>}
            </ul>

            {alertEntries.length > 0 && (
              <>
                <h4>🚨 Detailed Alerts</h4>
                <ul>
                  {alertEntries.map((entry, i) => (
                    <li key={i}>[{new Date(entry.timestamp).toLocaleString()}] — {entry.alerts.join(', ')}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VitalsChart;

