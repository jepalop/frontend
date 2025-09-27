import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://servidor-4f8v.onrender.com/signals");
        setSignals(res.data);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // refresca cada 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Brain Signals Dashboard</h1>

      <table border="1" cellPadding="5" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Timestamp</th>
            <th>Device</th>
            <th>Hex Data</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{new Date(s.timestamp).toLocaleString()}</td>
              <td>{s.device_id}</td>
              <td>{s.data_hex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
