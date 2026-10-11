import type {
    CreateJobApplication,
    JobApplication,
    UpdateJobApplication,
  } from "../types/jobApplication";
  import { authorizedFetch } from "./apiClient";
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5253";;
  
  export async function getJobApplications(): Promise<JobApplication[]> {
    const response = await authorizedFetch(`${apiBaseUrl}/api/JobApplications`);
  
    if (!response.ok) {
      throw new Error(
        `Unable to load job applications. Status: ${response.status}`
      );
    }
  
    return response.json();
  }
  
  export async function createJobApplication(
    application: CreateJobApplication
  ): Promise<JobApplication> {
    const response = await authorizedFetch(`${apiBaseUrl}/api/JobApplications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(application),
    });
  
    if (!response.ok) {
      throw new Error(
        `Unable to create job application. Status: ${response.status}`
      );
    }
  
    return response.json();
  }


  export async function deleteJobApplication(id: number): Promise<void> {
    const response = await authorizedFetch(
      `${apiBaseUrl}/api/JobApplications/${id}`,
      {
        method: "DELETE",
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Unable to delete job application. Status: ${response.status}`
      );
    }
  }

  export async function updateJobApplication(
    id: number,
    application: UpdateJobApplication
  ): Promise<void> {
    const response = await authorizedFetch(
      `${apiBaseUrl}/api/JobApplications/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(application),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Unable to update job application. Status: ${response.status}`
      );
    }
  }
