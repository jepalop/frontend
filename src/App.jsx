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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://servidor-4f8v.onrender.com/signals");
        const data = res.data.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp),
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

  // 🔹 filtrar últimos 10 segundos
  const latest = signals.length > 0 ? signals[0].timestamp : null;
  let signalsToShow = signals;
  if (latest) {
    const cutoff = new Date(latest.getTime() - 10 * 1000);
    signalsToShow = signals.filter((s) => s.timestamp >= cutoff);
  }

  // 🔹 convertir timestamp a string legible
  const chartData = signalsToShow.map((s) => ({
    ...s,
    timestamp: s.timestamp.toLocaleTimeString(),
  }));

  return (
    <div className="app">
      <h1>📊 Brain Signals (últimos 10s)</h1>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
