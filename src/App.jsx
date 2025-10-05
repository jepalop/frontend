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

// ====================================
// PSD Calculation
// ====================================
function computePSD(signal, fs = 250) {
  if (signal.length < 8) return [];

  const N = Math.pow(2, Math.floor(Math.log2(signal.length)));
  const trimmed = signal.slice(0, N);

  const fft = new FFT(N);
  const out = fft.createComplexArray();
  const data = fft.toComplexArray(trimmed);
  fft.transform(out, data);

  const freqs = Array(N / 2)
    .fill(0)
    .map((_, i) => (i * fs) / N);

  const psd = [];
  for (let i = 0; i < N / 2; i++) {
    const re = out[2 * i];
    const im = out[2 * i + 1];
    psd.push((re * re + im * im) / (N * fs));
  }

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
    bandPower[band] = avgPower;
  }

  return Object.entries(bandPower).map(([band, power]) => ({
    band,
    power,
  }));
}

// ====================================
// EEG Chart
// ====================================
function EEGChart({ data }) {
  const [chartHeight, setChartHeight] = useState(getChartHeight("eeg"));

  function getChartHeight(type) {
    const h = window.innerHeight;
    const w = window.innerWidth;
    if (w > 1900) return type === "eeg" ? 500 : 350;
    if (h > 1300) return type === "eeg" ? 450 : 320;
    if (h > 1000) return type === "eeg" ? 320 : 240;
    return type === "eeg" ? 220 : 180;
  }

  useEffect(() => {
    const handleResize = () => setChartHeight(getChartHeight("eeg"));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
        <YAxis
          label={{ value: "µV", angle: -90, position: "insideLeft" }}
          domain={["auto", "auto"]}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00b894"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ====================================
// PSD Chart
// ====================================
function PSDChart({ data }) {
  const [chartHeight, setChartHeight] = useState(getChartHeight("psd"));

  function getChartHeight(type) {
    const h = window.innerHeight;
    const w = window.innerWidth;
    if (w > 1900) return type === "eeg" ? 500 : 350;
    if (h > 1300) return type === "eeg" ? 450 : 320;
    if (h > 1000) return type === "eeg" ? 320 : 240;
    return type === "eeg" ? 220 : 180;
  }

  useEffect(() => {
    const handleResize = () => setChartHeight(getChartHeight("psd"));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
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
            style: { textAnchor: "middle" }, // centra el texto
          }}
        />

        <Tooltip formatter={(val) => val.toFixed(2)} />
        <Bar dataKey="power" fill="#6c5ce7" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ====================================
// Clinic View
// ====================================
function ClinicView() {
  const [totalDuration, setTotalDuration] = useState(30);
  const [windowDuration, setWindowDuration] = useState(60);
  const [windowStart, setWindowStart] = useState(0);
  const [signals, setSignals] = useState([]);
  const [visibleSignals, setVisibleSignals] = useState([]);
  const [psdData, setPsdData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fs = 250;
  const totalSamples = totalDuration * fs;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://servidor-4f8v.onrender.com/signals/processed?limit=${totalSamples}`
      );
      const data = res.data.map((s) => ({
        id: s.id,
        timestamp: new Date(s.timestamp).toLocaleTimeString(),
        value: s.value_uv ?? 0,
      }));
      setSignals(data.reverse());
    } catch (err) {
      console.error("Error Clinic:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setWindowStart(0);
  }, [totalDuration]);

  useEffect(() => {
    if (signals.length === 0) return;

    const startIndex = Math.floor(windowStart * fs);
    const endIndex = Math.floor((windowStart + windowDuration) * fs);
    const chunk = signals.slice(startIndex, endIndex);
    setVisibleSignals(chunk);

    const psd = computePSD(chunk.map((s) => s.value), fs);
    setPsdData(psd);
  }, [signals, windowStart, windowDuration]);

  const zoomIn = () => setWindowDuration((prev) => Math.max(1, prev / 2));
  const zoomOut = () => setWindowDuration((prev) => Math.min(totalDuration, prev * 2));

  const handleScroll = (e) => setWindowStart(parseFloat(e.target.value));
  const maxScroll = Math.max(0, totalDuration - windowDuration);

  return (
    <div>
      <div className="controls">
        {[30, 60, 600, 900, 1800, 3600].map((sec) => (
          <button
            key={sec}
            className={`time-button ${totalDuration === sec ? "active" : ""}`}
            onClick={() => {
              setTotalDuration(sec);
              setWindowStart(0);
            }}
          >
            {sec < 60
              ? `${sec}s`
              : sec < 3600
              ? `${sec / 60} min`
              : `${sec / 3600} h`}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div className="chart-grid">
          <div className="chart-box">
            <h3>EEG ({windowDuration}s)</h3>
            <EEGChart data={visibleSignals} />

            {/* Scroll justo debajo */}
            <div className="scroll-container">
              <input
                type="range"
                min="0"
                max={maxScroll}
                step="0.5"
                value={windowStart}
                onChange={handleScroll}
                className="scroll-slider"
              />
              <div className="scroll-info">
                <p>
                  Ventana: {windowDuration}s | Inicio: {windowStart.toFixed(1)}s / {totalDuration}s
                </p>
                <div className="zoom-controls">
                  <button onClick={zoomOut} className="zoom-btn">
                    Zoom -
                  </button>
                  <button onClick={zoomIn} className="zoom-btn">
                    Zoom +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-box">
            <h3>PSD (Bandas EEG — ventana actual)</h3>
            <PSDChart data={psdData} />
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================
// Live Mode
// ====================================
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
        console.error("Error Live:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="chart-grid">
        <div className="chart-box">
          <h3>EEG (Live)</h3>
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

// ====================================
// Main App
// ====================================
function App() {
  const [mode, setMode] = useState("live");

  return (
    <div className="app">
      <div className="mode-selector">
        <button
          className={mode === "live" ? "active" : ""}
          onClick={() => setMode("live")}
        >
          Live Mode
        </button>
        <button
          className={mode === "clinic" ? "active" : ""}
          onClick={() => setMode("clinic")}
        >
          Clinic Mode
        </button>
      </div>

      {mode === "clinic" ? (
  <ClinicView />
) : (
  <>
    {/* Reservar espacio para mantener alineación */}
    <div className="controls-placeholder"></div>
    <LiveView />
  </>
)}

    </div>
  );
}

export default App;
