import { useEffect, useState, useMemo, useRef } from "react";
import JobApplicationForm from "./components/JobApplicationForm";
import {
  getJobApplications,
  deleteJobApplication,
} from "./services/jobApplicationService";
import type { JobApplication } from "./types/jobApplication";
import EditJobApplicationForm from "./components/EditJobApplicationForm";
import UpcomingInterviews from "./components/UpcomingInterviews";
import InterviewForm from "./components/InterviewForm";
import type { Interview } from "./types/interview";
import DashboardStatistics from "./components/DashboardStatistics";
import { getStoredAuth, logout } from "./services/authService";
import type { AuthResponse } from "./types/auth";
import AuthPage from "./components/AuthPage";
import InterviewCalendar from "./components/InterviewCalendar";
import "./App.css";

function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null);
  const [schedulingApplication, setSchedulingApplication] =
    useState<JobApplication | null>(null);
  const [interviewRefreshKey, setInterviewRefreshKey] = useState(0);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());
  const scheduleFormRef = useRef<HTMLDivElement | null>(null);
  const applicationFormRef = useRef<HTMLDivElement | null>(null);
  const applicationsPerPage = 6;

  const [currentApplicationPage, setCurrentApplicationPage] = useState(1);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        normalizedSearch === "" ||
        application.companyName.toLowerCase().includes(normalizedSearch) ||
        application.position.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const totalApplicationPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / applicationsPerPage),
  );

  const pagedApplications = filteredApplications.slice(
    (currentApplicationPage - 1) * applicationsPerPage,
    currentApplicationPage * applicationsPerPage,
  );

  useEffect(() => {
    if (currentApplicationPage > totalApplicationPages) {
      setCurrentApplicationPage(totalApplicationPages);
    }
  }, [currentApplicationPage, totalApplicationPages]);

  useEffect(() => {
    setCurrentApplicationPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (!schedulingApplication) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      scheduleFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [schedulingApplication]);

  useEffect(() => {
    async function loadApplications() {
      // Immediately remove data belonging to the previous user.
      setApplications([]);

      if (!auth) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await getJobApplications();
        setApplications(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load applications.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, [auth?.userId]);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      applicationFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [showForm]);

  function handleCreated(application: JobApplication) {
    setApplications((current) => [application, ...current]);

    setCurrentApplicationPage(1);
    setShowForm(false);
    setDashboardRefreshKey((current) => current + 1);
  }

  function handleUpdated(updatedApplication: JobApplication) {
    setApplications((current) =>
      current.map((application) =>
        application.id === updatedApplication.id
          ? updatedApplication
          : application,
      ),
    );

    setEditingApplication(null);
  }

  function handleInterviewCreated(interview: Interview) {
    setApplications((current) =>
      current.map((application) =>
        application.id === interview.jobApplicationId
          ? {
              ...application,
              status: interview.stage,
            }
          : application,
      ),
    );

    setSchedulingApplication(null);
    setInterviewRefreshKey((current) => current + 1);
    setDashboardRefreshKey((current) => current + 1);
  }

  function handleLogout() {
    logout();

    setAuth(null);
    setApplications([]);
    setShowForm(false);
    setEditingApplication(null);
    setSchedulingApplication(null);
    setSearchTerm("");
    setStatusFilter("All");
    setInterviewRefreshKey(0);
    setDashboardRefreshKey(0);
  }

  async function handleDelete(application: JobApplication) {
    const confirmed = window.confirm(
      `Delete the application for ${application.position} at ` +
        `${application.companyName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(application.id);
      setError(null);

      await deleteJobApplication(application.id);

      setApplications((current) =>
        current.filter((item) => item.id !== application.id),
      );

      // Reload interviews because related interviews were cascade deleted.
      setInterviewRefreshKey((current) => current + 1);

      // Reload dashboard counters.
      setDashboardRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleAddApplication() {
    setEditingApplication(null);
    setSchedulingApplication(null);
    setShowForm(true);
  }

  if (!auth) {
    return <AuthPage onLogin={setAuth} />;
  }

  return (
    <main className="app-container">
      <header className="page-header">
        <div className="header-actions">
          <span>Welcome, {auth.displayName}</span>

          {!showForm && !editingApplication && !schedulingApplication && (
            <button type="button" onClick={() => setShowForm(true)}>
              Add application
            </button>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>
      <DashboardStatistics
        key={`dashboard-${auth.userId}`}
        refreshKey={dashboardRefreshKey}
      />

      <UpcomingInterviews
        key={`interviews-${auth.userId}`}
        refreshKey={interviewRefreshKey}
        onChanged={() => {
          setInterviewRefreshKey((current) => current + 1);
          setDashboardRefreshKey((current) => current + 1);
        }}
      />

      <InterviewCalendar
        key={`calendar-${auth.userId}`}
        refreshKey={interviewRefreshKey}
      />

      {schedulingApplication && (
        <div ref={scheduleFormRef} className="schedule-form-wrapper">
          <InterviewForm
            application={schedulingApplication}
            onCreated={handleInterviewCreated}
            onCancel={() => setSchedulingApplication(null)}
          />
        </div>
      )}

      {showForm && (
        <div ref={applicationFormRef}>
          <JobApplicationForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingApplication && (
        <EditJobApplicationForm
          key={editingApplication.id}
          application={editingApplication}
          onUpdated={handleUpdated}
          onCancel={() => setEditingApplication(null)}
        />
      )}

      <section className="application-section">
        <div className="application-heading">
          <div>
            <h2>Job applications</h2>
            <p>
              Showing {filteredApplications.length} of {applications.length}{" "}
              applications
            </p>
          </div>

          <div className="filter-controls">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search company or position"
              aria-label="Search applications"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              <option value="Applied">Applied</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Final Interview">Final Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            {(searchTerm || statusFilter !== "All") && (
              <button
                type="button"
                className="clear-button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {isLoading && <p className="message">Loading applications...</p>}

      {error && <p className="error-message">{error}</p>}

      {!isLoading &&
        !error &&
        applications.length > 0 &&
        filteredApplications.length === 0 && (
          <p className="message">
            No applications match your search or selected status.
          </p>
        )}

      {!isLoading && !error && filteredApplications.length > 0 && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Applied date</th>
                  <th>Job posting</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedApplications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.companyName}</td>
                    <td>{application.position}</td>
                    <td>
                      <span className="status-badge">{application.status}</span>
                    </td>
                    <td>
                      {new Date(
                        `${application.appliedDate.substring(0, 10)}T00:00:00`,
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      {application.jobUrl ? (
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View job
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="schedule-button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingApplication(null);
                            setSchedulingApplication(application);
                          }}
                        >
                          Schedule
                        </button>

                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingApplication(application);
                            setSchedulingApplication(null);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          disabled={deletingId === application.id}
                          onClick={() => handleDelete(application)}
                        >
                          {deletingId === application.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredApplications.length > applicationsPerPage && (
            <nav className="pagination" aria-label="Application pagination">
              <button
                type="button"
                disabled={currentApplicationPage === 1}
                onClick={() =>
                  setCurrentApplicationPage((current) => current - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {currentApplicationPage} of {totalApplicationPages}
              </span>

              <button
                type="button"
                disabled={currentApplicationPage === totalApplicationPages}
                onClick={() =>
                  setCurrentApplicationPage((current) => current + 1)
                }
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      {!showForm && !editingApplication && !schedulingApplication && (
        <button
          type="button"
          className="floating-add-button"
          onClick={handleAddApplication}
        >
          <span aria-hidden="true">+</span>
          Add Application
        </button>
      )}
    </main>
  );
}

export default App;
