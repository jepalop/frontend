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

function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        overflow: "hidden", // 👈 evita scroll global
      }}
    >
      {/* Título */}
      <div style={{ flex: "0 0 auto", padding: "1px" }}>
        <h1>📊 Brain Signals Dashboard</h1>
      </div>

      {/* Contenedor tabla + gráfica */}
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          gap: "10px",
          padding: "10px",
          overflow: "hidden",
        }}
      >
        {/* === TABLA === */}
        <div
          style={{
            flex: 3,
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // 👈 necesario para que flex permita scroll interno
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>Datos en tabla</h2>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table
              border="1"
              cellPadding="5"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
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
                {signals.map((s) => (
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
        <div
          style={{
            flex: 7,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>Gráfico de valores</h2>
          <div style={{ flex: 1 }}>
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
    </div>
  );
}

export default App;
