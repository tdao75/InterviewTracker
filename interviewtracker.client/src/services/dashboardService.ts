import type { DashboardStatistics } from "../types/dashboardStatistics";
import { authorizedFetch } from "./apiClient";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5253";;

export async function getDashboardStatistics():
  Promise<DashboardStatistics> {
  const response = await authorizedFetch(
    `${apiBaseUrl}/api/Dashboard/statistics`
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load dashboard statistics. Status: ${response.status}`
    );
  }

  return response.json();
}