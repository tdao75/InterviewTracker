import { useEffect, useState, useRef } from "react";
import EditInterviewForm from "./EditInterviewForm";
import {
  getUpcomingInterviews,
  deleteInterview,
} from "../services/interviewService";
import type { Interview } from "../types/interview";

interface UpcomingInterviewsProps {
  refreshKey: number;
  onChanged: () => void;
}

function UpcomingInterviews({
  refreshKey,
  onChanged,
}: UpcomingInterviewsProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null,
  );

  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingInterview) {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingInterview]);

  useEffect(() => {
    async function loadInterviews() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getUpcomingInterviews();
        setInterviews(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load upcoming interviews.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadInterviews();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <section className="interview-section">
        <h2>Upcoming interviews</h2>
        <p>Loading interviews...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="interview-section">
        <h2>Upcoming interviews</h2>
        <p className="error-message">{error}</p>
      </section>
    );
  }
  async function handleDelete(interview: Interview) {
    const confirmed = window.confirm(
      `Delete the ${interview.stage} interview with ` +
        `${interview.companyName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(interview.id);
      setError(null);

      await deleteInterview(interview.id);

      setInterviews((current) =>
        current.filter((item) => item.id !== interview.id),
      );
      onChanged();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete the interview.";

      setError(message);
    } finally {
      setDeletingId(null);
    }
  }
  function handleUpdated(updatedInterview: Interview) {
    setInterviews((current) =>
      current.map((interview) =>
        interview.id === updatedInterview.id ? updatedInterview : interview,
      ),
    );

    setEditingInterview(null);
    onChanged();
  }

  return (
    <section className="interview-section">
      <div className="section-heading">
        <div>
          <h2>Upcoming interviews</h2>
          <p>Your next scheduled interviews.</p>
        </div>

        <span className="interview-count">{interviews.length}</span>
      </div>

      {editingInterview && (
        <div ref={editFormRef}>
          <EditInterviewForm
            interview={editingInterview}
            onUpdated={handleUpdated}
            onCancel={() => setEditingInterview(null)}
          />
        </div>
      )}

      {interviews.length === 0 ? (
        <p className="empty-interviews">
          You do not have any upcoming interviews.
        </p>
      ) : (
        <div className="interview-grid">
          {interviews.map((interview) => {
            const scheduledDate = new Date(interview.scheduledAt);

            return (
              <article className="interview-card" key={interview.id}>
                <div className="interview-card-heading">
                  <div>
                    <h3>{interview.companyName}</h3>
                    <p>{interview.position}</p>
                  </div>

                  <span className="stage-badge">{interview.stage}</span>
                </div>

                <dl className="interview-details">
                  <div>
                    <dt>Date</dt>
                    <dd>{scheduledDate.toLocaleDateString()}</dd>
                  </div>

                  <div>
                    <dt>Time</dt>
                    <dd>
                      {scheduledDate.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>

                  <div>
                    <dt>Type</dt>
                    <dd>{interview.interviewType}</dd>
                  </div>

                  <div>
                    <dt>Location</dt>
                    <dd>{interview.location || "Not provided"}</dd>
                  </div>
                </dl>

                {interview.interviewerName && (
                  <p>
                    <strong>Interviewer:</strong> {interview.interviewerName}
                  </p>
                )}

                <div className="interview-actions">
                  {interview.meetingUrl && (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="meeting-link"
                    >
                      Open meeting
                    </a>
                  )}

                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => setEditingInterview(interview)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    disabled={deletingId === interview.id}
                    onClick={() => handleDelete(interview)}
                  >
                    {deletingId === interview.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default UpcomingInterviews;
