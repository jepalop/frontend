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
        // Convertimos hex → decimal
        const data = res.data.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp).toLocaleTimeString(),
          device_id: s.device_id,
          hex: s.data_hex,
          value: parseInt(s.data_hex, 16), // 👈 conversión aquí
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
    <div style={{ padding: "20px" }}>
      <h1>📊 Brain Signals Dashboard</h1>

      {/* === GRÁFICO === */}
      <h2>Gráfico de valores</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={signals.slice(0, 20).reverse()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      {/* === TABLA === */}
      <h2>Datos en tabla</h2>
      <table border="1" cellPadding="5" style={{ marginTop: "20px" }}>
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
  );
}

export default App;
