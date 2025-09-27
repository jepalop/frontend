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
    // listener para detectar cambio de tamaño
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const fetchData = async () => {
      try {
        const res = await axios.get("https://servidor-4f8v.onrender.com/signals");
        const data = res.data.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp).toLocaleTimeString(),
          device_id: s.device_id,
          hex: s.data_hex,
          value: parseInt(s.data_hex, 16),
        }));
        setSignals(data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  // 🔹 en móvil solo mostramos las últimas 10 filas
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
                  <th>Hex Data</th>
                  <th>Decimal</th>
                </tr>
              </thead>
              <tbody>
                {signalsToShow.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.timestamp}</td>
                    <td>{s.device_id}</td>
                    <td>{s.hex}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* === GRÁFICO === */}
        <div className="chart-container">
          <h2>Gráfico de valores</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signals.slice(0, 20).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
