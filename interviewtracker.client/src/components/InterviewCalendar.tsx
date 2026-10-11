import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import themePlugin from "@fullcalendar/react/themes/monarch";
import { getInterviews } from "../services/interviewService";
import type { Interview } from "../types/interview";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/blue.css";

interface InterviewCalendarProps {
  refreshKey: number;
}

function InterviewCalendar({ refreshKey }: InterviewCalendarProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );

  const currentCalendarDateRef = useRef<Date | null>(null);

  useEffect(() => {
    async function loadInterviews() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getInterviews();

        setInterviews(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load the interview calendar.";

        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadInterviews();
  }, [refreshKey]);

  const events = interviews.map((interview) => ({
    id: interview.id.toString(),
    title: interview.companyName,
    start: interview.scheduledAt,
    extendedProps: {
      companyName: interview.companyName,
      position: interview.position,
      stage: interview.stage,
      interviewType: interview.interviewType,
      interviewerName: interview.interviewerName,
      meetingUrl: interview.meetingUrl,
      location: interview.location,
      notes: interview.notes,
    },
  }));

  return (
    <section className="calendar-section">
      <div className="section-heading">
        <div>
          <h2>Interview calendar</h2>
          <p>Select an interview to view its details.</p>
        </div>
      </div>

      {isLoading && <p className="message">Loading calendar...</p>}

      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && (
        <FullCalendar
          plugins={[themePlugin, dayGridPlugin]}
          initialView="dayGridMonth"
          initialDate={
            currentCalendarDateRef.current ??
            (interviews.length > 0 ? interviews[0].scheduledAt : undefined)
          }
          datesSet={(dateInfo) => {
            currentCalendarDateRef.current = dateInfo.view.calendar.getDate();
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          timeZone="local"
          events={events}
          height={650}
          dayMaxEvents={2}
          eventContent={(eventInfo) => (
            <div className="calendar-event-content">
              {eventInfo.timeText && (
                <span className="calendar-event-time">
                  {eventInfo.timeText}
                </span>
              )}

              <span className="calendar-event-company">
                {eventInfo.event.extendedProps.companyName}
              </span>
            </div>
          )}
          eventDidMount={(info) => {
            info.el.style.maxWidth = "100%";
            info.el.style.overflow = "hidden";

            requestAnimationFrame(() => {
              let parent = info.el.parentElement;

              while (parent && parent.closest(".calendar-section")) {
                parent.style.maxWidth = "100%";
                parent.style.overflow = "hidden";

                if (parent.style.visibility === "hidden") {
                  parent.style.setProperty(
                    "visibility",
                    "visible",
                    "important",
                  );
                }

                parent = parent.parentElement;
              }
            });
          }}
          eventClick={(info) => {
            const interviewId = Number(info.event.id);

            const interview = interviews.find(
              (item) => item.id === interviewId,
            );

            if (interview) {
              setSelectedInterview(interview);
            }
          }}
        />
      )}
      {selectedInterview && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="interview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-stage">{selectedInterview.stage}</span>

                <h2 id="interview-modal-title">
                  {selectedInterview.companyName}
                </h2>

                <p>{selectedInterview.position}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setSelectedInterview(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-details">
              <div>
                <span>Date and time</span>
                <strong>
                  {new Date(selectedInterview.scheduledAt).toLocaleString([], {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </strong>
              </div>

              <div>
                <span>Interview type</span>
                <strong>{selectedInterview.interviewType}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{selectedInterview.location || "Not provided"}</strong>
              </div>

              <div>
                <span>Interviewer</span>
                <strong>
                  {selectedInterview.interviewerName || "Not provided"}
                </strong>
              </div>
            </div>

            {selectedInterview.notes && (
              <div className="modal-notes">
                <span>Preparation notes</span>
                <p>{selectedInterview.notes}</p>
              </div>
            )}

            <div className="modal-actions">
              {selectedInterview.meetingUrl && (
                <a
                  className="modal-meeting-button"
                  href={selectedInterview.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open meeting
                </a>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedInterview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InterviewCalendar;
