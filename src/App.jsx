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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "https://servidor-4f8v.onrender.com/signals/processed?limit=2500"
        );

        const processed = res.data.reverse();

        const formatted = processed.map((p) => ({
          timestamp: new Date(p.timestamp).toLocaleTimeString(),
          value: p.value_uv,
        }));

        setData(formatted);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // refresco cada 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="app">
      <h1>📊 Señal Filtrada</h1>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis
              label={{ value: "µV", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
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
