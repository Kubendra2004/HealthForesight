import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PatientResourceForecast() {
  const [forecastData, setForecastData] = useState({ beds: [], oxygen: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/ml/predict/resources?days=7"
      );
      if (res.ok) {
        const data = await res.json();
        console.log("Forecast data received:", data);
        // Ensure data structure is correct
        setForecastData({
          beds: data.beds || [],
          oxygen: data.oxygen || [],
          icu: data.icu || [],
          er_visits: data.er_visits || [],
        });
      } else {
        console.error("Forecast fetch failed with status:", res.status);
      }
    } catch (err) {
      console.error("Error fetching forecast:", err);
    }
    setLoading(false);
  };

  // Prepare chart data for beds
  const bedsChartData = {
    labels: forecastData.beds?.map((d) => d.date) || [],
    datasets: [
      {
        type: "bar",
        label: "Predicted Occupancy",
        data: forecastData.beds?.map((d) => d.prediction) || [],
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Prepare chart data for oxygen
  const oxygenChartData = {
    labels: forecastData.oxygen?.map((d) => d.date) || [],
    datasets: [
      {
        type: "bar",
        label: "Predicted Usage (L)",
        data: forecastData.oxygen?.map((d) => d.prediction) || [],
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#1e293b", font: { size: 12, weight: "600" } },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
      },
      y: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.2)" },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
        <div>Loading resource forecast...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Info Banner */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          borderRadius: "12px",
          border: "1px solid #bae6fd",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>ℹ️</span>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#0369a1",
            lineHeight: "1.5",
          }}
        >
          <strong>Hospital Resource Availability:</strong> View the projected
          availability of beds and oxygen supplies for the next 7 days. This
          helps you plan your appointments.
        </div>
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Beds Forecast Chart */}
        {forecastData.beds && forecastData.beds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              🛏️ Bed Availability Forecast (7 Days)
            </h3>
            <div style={{ height: "350px" }}>
              <Bar data={bedsChartData} options={chartOptions} />
            </div>
          </motion.div>
        )}

        {/* Oxygen Forecast Chart */}
        {forecastData.oxygen && forecastData.oxygen.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              💨 Oxygen Supply Forecast (7 Days)
            </h3>
            <div style={{ height: "350px" }}>
              <Bar data={oxygenChartData} options={chartOptions} />
            </div>
          </motion.div>
        )}

        {/* ICU Forecast Chart */}
        {forecastData.icu && forecastData.icu.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              🏥 ICU Admissions Forecast (7 Days)
            </h3>
            <div style={{ height: "350px" }}>
              <Bar
                data={{
                  labels: forecastData.icu?.map((d) => d.date) || [],
                  datasets: [
                    {
                      type: "bar",
                      label: "Predicted ICU Admissions",
                      data: forecastData.icu?.map((d) => d.prediction) || [],
                      backgroundColor: "rgba(34, 197, 94, 0.7)",
                      borderColor: "rgba(34, 197, 94, 1)",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </motion.div>
        )}

        {/* ER Visits Forecast Chart */}
        {forecastData.er_visits && forecastData.er_visits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h3
              style={{
                color: "#1e293b",
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              🚑 ER Visits Forecast (7 Days)
            </h3>
            <div style={{ height: "350px" }}>
              <Bar
                data={{
                  labels: forecastData.er_visits?.map((d) => d.date) || [],
                  datasets: [
                    {
                      type: "bar",
                      label: "Predicted ER Visits",
                      data:
                        forecastData.er_visits?.map((d) => d.prediction) || [],
                      backgroundColor: "rgba(234, 179, 8, 0.7)",
                      borderColor: "rgba(234, 179, 8, 1)",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
