import { useEffect, useState } from "react";
import { getDashboardStatistics } from "../services/dashboardService";
import type { DashboardStatistics as Statistics } from "../types/dashboardStatistics";

interface DashboardStatisticsProps {
  refreshKey: number;
}

function DashboardStatistics({ refreshKey }: DashboardStatisticsProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatistics() {
      try {
        setError(null);

        const data = await getDashboardStatistics();
        setStatistics(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load dashboard statistics.";

        setError(message);
      }
    }

    loadStatistics();
  }, [refreshKey]);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!statistics) {
    return <p className="message">Loading dashboard...</p>;
  }

  const cards = [
    {
      label: "Applications",
      value: statistics.totalApplications,
      color: "blue",
    },
    {
      label: "All interviews",
      value: statistics.totalInterviews,
      color: "purple",
    },
    {
      label: "Upcoming",
      value: statistics.upcomingInterviews,
      color: "orange",
    },
    {
      label: "Offers",
      value: statistics.offers,
      color: "green",
    },
    {
      label: "Rejected",
      value: statistics.rejections,
      color: "red",
    },
  ];

  return (
    <section className="statistics-grid">
      {cards.map((card) => (
        <article
          className={`statistics-card statistics-${card.color}`}
          key={card.label}
        >
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default DashboardStatistics;
