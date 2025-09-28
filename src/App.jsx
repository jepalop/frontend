import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const fetchData = async () => {
      try {
        const res = await axios.get("https://servidor-4f8v.onrender.com/signals");
        const data = res.data.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp).toLocaleTimeString(),
          device_id: s.device_id,
          value_uv: s.value_uv, // 👈 directamente en microvoltios
        }));
        setSignals(data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // cada 10s
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  const signalsToShow = isMobile ? signals.slice(0, 10) : signals;

  return (
    <div className="app">
      <h1>📊 Brain Signals Dashboard</h1>

      <div className="content">
        {/* === TABLA === */}
        <div className="table-container">
          <h2>Datos en tabla</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Device</th>
                  <th>Valor (µV)</th>
                </tr>
              </thead>
              <tbody>
                {signalsToShow.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.timestamp}</td>
                    <td>{s.device_id}</td>
                    <td>{s.value_uv?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* === GRÁFICO === */}
        <div className="chart-container">
          <h2>Gráfico de valores (µV)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signals.slice(-50)}> {/* últimas 50 muestras */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis
                label={{ value: "µV", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value_uv"
                stroke="#00b894"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
