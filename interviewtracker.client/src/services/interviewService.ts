import type { Interview, CreateInterview, UpdateInterview } from "../types/interview";
import { authorizedFetch } from "./apiClient";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5253";;

export async function getUpcomingInterviews(): Promise<Interview[]> {
  const response = await authorizedFetch(
    `${apiBaseUrl}/api/Interviews/upcoming`
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load upcoming interviews. Status: ${response.status}`
    );
  }

  return response.json();
}

export async function createInterview(
    interview: CreateInterview
  ): Promise<Interview> {
    const response = await authorizedFetch(`${apiBaseUrl}/api/Interviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interview),
    });
  
    if (!response.ok) {
      throw new Error(
        `Unable to schedule interview. Status: ${response.status}`
      );
    }
  
    return response.json();
  }

  export async function deleteInterview(id: number): Promise<void> {
    const response = await authorizedFetch(
      `${apiBaseUrl}/api/Interviews/${id}`,
      {
        method: "DELETE",
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Unable to delete interview. Status: ${response.status}`
      );
    }
  }

  export async function updateInterview(
    id: number,
    interview: UpdateInterview
  ): Promise<void> {
    const response = await authorizedFetch(
      `${apiBaseUrl}/api/Interviews/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(interview),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Unable to update interview. Status: ${response.status}`
      );
    }
  }

  export async function getInterviews(): Promise<Interview[]> {
    const response = await authorizedFetch(
      `${apiBaseUrl}/api/Interviews`
    );
  
    if (!response.ok) {
      throw new Error(
        `Unable to load interviews. Status: ${response.status}`
      );
    }
  
    return response.json();
  }