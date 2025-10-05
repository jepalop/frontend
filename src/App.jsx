import { useEffect, useState } from "react";
import axios from "axios";
import FFT from "fft.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";

// ===========================
// PSD Calculation (FFT-based)
// ===========================
function computePSD(signal, fs = 250) {
  const N = Math.pow(2, Math.floor(Math.log2(signal.length)));
  const trimmed = signal.slice(0, N);

  const fft = new FFT(N);
  const out = fft.createComplexArray();
  const data = fft.toComplexArray(trimmed);
  fft.transform(out, data);

  const freqs = Array(N / 2)
    .fill(0)
    .map((_, i) => (i * fs) / N);

  // PSD = |FFT|² / (N * fs)
  const psd = [];
  for (let i = 0; i < N / 2; i++) {
    const re = out[2 * i];
    const im = out[2 * i + 1];
    const power = (re * re + im * im) / (N * fs);
    psd.push(power);
  }

  // Agrupar por bandas EEG
  const bands = {
    Delta: [0, 4],
    Theta: [4, 8],
    Alpha: [8, 12],
    Beta: [12, 30],
    Gamma: [30, 70],
  };

  const bandPower = {};
  for (const [band, [fLow, fHigh]] of Object.entries(bands)) {
    const indices = freqs
      .map((f, i) => (f >= fLow && f < fHigh ? i : -1))
      .filter((i) => i >= 0);
    const avgPower =
      indices.reduce((sum, i) => sum + psd[i], 0) / Math.max(indices.length, 1);
    bandPower[band] = avgPower * 1e6; // escalar para visualización
  }

  return Object.entries(bandPower).map(([band, power]) => ({
    band,
    power,
  }));
}

// ===========================
// EEG Chart
// ===========================
function EEGChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" minTickGap={40} tick={{ fontSize: 10 }} />
        <YAxis
          label={{ value: "µV", angle: -90, position: "insideLeft" }}
          domain={["auto", "auto"]}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00b894"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===========================
// PSD Chart
// ===========================
function PSDChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="band"
          label={{ value: "Bandas EEG", position: "insideBottom", offset: -5 }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{
            value: "Potencia (µV²/Hz)",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip formatter={(val) => val.toFixed(2)} />
        <Bar dataKey="power" fill="#6c5ce7" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===========================
// Live Mode
// ===========================
function LiveView() {
  const [signals, setSignals] = useState([]);
  const [psdData, setPsdData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "https://servidor-4f8v.onrender.com/signals/processed?limit=2500"
        );
        const data = res.data.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp).toLocaleTimeString(),
          value: s.value_uv ?? 0,
        }));
        setSignals(data);
        setPsdData(computePSD(data.map((s) => s.value), 250));
      } catch (err) {
        console.error("❌ Error Live:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h2>⚡ Modo Live (últimos 10 s actualizados en tiempo real)</h2>
      <div className="chart-grid">
        <div className="chart-box">
          <h3>Señal EEG (Live)</h3>
          <EEGChart data={signals} />
        </div>
        <div className="chart-box">
          <h3>PSD (Bandas EEG)</h3>
          <PSDChart data={psdData} />
        </div>
      </div>
    </>
  );
}

// ===========================
// Clinic Mode (Extended)
// ===========================
function ClinicView() {
  const [duration, setDuration] = useState(10);
  const [signals, setSignals] = useState([]);
  const [psdData, setPsdData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (seconds) => {
    setLoading(true);
    try {
      const samples = seconds * 250;
      const res = await axios.get(
        `https://servidor-4f8v.onrender.com/signals/processed?limit=${samples}`
      );
      const data = res.data.map((s) => ({
        id: s.id,
        timestamp: new Date(s.timestamp).toLocaleTimeString(),
        value: s.value_uv ?? 0,
      }));
      setSignals(data);
      setPsdData(computePSD(data.map((s) => s.value), 250));
    } catch (err) {
      console.error("❌ Error Clinic:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(duration);
  }, [duration]);

  return (
    <>
      <h2>🧠 Modo Clinic (análisis de base de datos)</h2>
      <div className="controls">
        <p>Selecciona ventana temporal:</p>
        {/* Añadimos segundos y minutos */}
        {[
          { label: "1s", value: 1 },
          { label: "5s", value: 5 },
          { label: "10s", value: 10 },
          { label: "20s", value: 20 },
          { label: "30s", value: 30 },
          { label: "1min", value: 60 },
          { label: "10min", value: 600 },
          { label: "30min", value: 1800 },
          { label: "1h", value: 3600 },
        ].map((t) => (
          <button
            key={t.value}
            className={`time-button ${duration === t.value ? "active" : ""}`}
            onClick={() => setDuration(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div className="chart-grid">
          <div className="chart-box">
            <h3>Señal EEG ({duration >= 60 ? `${duration / 60} min` : `${duration}s`})</h3>
            <EEGChart data={signals} />
          </div>
          <div className="chart-box">
            <h3>PSD (Bandas EEG)</h3>
            <PSDChart data={psdData} />
          </div>
        </div>
      )}
    </>
  );
}

// ===========================
// Main App
// ===========================
function App() {
  const [mode, setMode] = useState("live");

  return (
    <div className="app">
      <div className="mode-selector">
        <button
          className={mode === "live" ? "active" : ""}
          onClick={() => setMode("live")}
        >
          🔴 Modo Live
        </button>
        <button
          className={mode === "clinic" ? "active" : ""}
          onClick={() => setMode("clinic")}
        >
          🧠 Modo Clinic
        </button>
      </div>

      {mode === "live" ? <LiveView /> : <ClinicView />}
    </div>
  );
}

export default App;
