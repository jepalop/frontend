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
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rawRes, procRes] = await Promise.all([
          axios.get("https://servidor-4f8v.onrender.com/signals?limit=2500"),
          axios.get("https://servidor-4f8v.onrender.com/signals/processed?limit=2500"),
        ]);

        const raw = rawRes.data.reverse();
        const proc = procRes.data.reverse();

        // 🔹 Alinear las señales por índice (asumiendo misma longitud)
        const combined = raw.map((r, i) => ({
          timestamp: new Date(r.timestamp).toLocaleTimeString(),
          raw: r.value_uv,
          filtered: proc[i] ? proc[i].value_uv : null,
        }));

        setData(combined);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="app">
      <h1>📊 Señales Raw vs Filtradas</h1>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis label={{ value: "µV", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="raw"
              stroke="#d63031"
              strokeWidth={1}
              dot={false}
              name="Raw"
            />
            <Line
              type="monotone"
              dataKey="filtered"
              stroke="#0984e3"
              strokeWidth={2}
              dot={false}
              name="Filtrada"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
