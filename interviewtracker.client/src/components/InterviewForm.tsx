import { useState, type ChangeEvent, type FormEvent } from "react";
import { createInterview } from "../services/interviewService";
import type { CreateInterview, Interview } from "../types/interview";
import type { JobApplication } from "../types/jobApplication";

interface InterviewFormProps {
  application: JobApplication;
  onCreated: (interview: Interview) => void;
  onCancel: () => void;
}

function InterviewForm({
  application,
  onCreated,
  onCancel,
}: InterviewFormProps) {
  const [form, setForm] = useState<CreateInterview>({
    jobApplicationId: application.id,
    interviewType: "Microsoft Teams",
    stage: "HR Interview",
    scheduledAt: "",
    location: "Remote",
    meetingUrl: "",
    interviewerName: "",
    notes: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const createdInterview = await createInterview({
        ...form,
        location: form.location?.trim() || null,
        meetingUrl: form.meetingUrl?.trim() || null,
        interviewerName: form.interviewerName?.trim() || null,
        notes: form.notes?.trim() || null,
      });

      onCreated(createdInterview);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="form-card">
      <div className="form-heading">
        <div>
          <h2>Schedule interview</h2>
          <p>
            {application.position} at {application.companyName}
          </p>
        </div>

        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Interview stage
            <select
              name="stage"
              value={form.stage}
              onChange={updateField}
              required
            >
              <option value="HR Interview">HR Interview</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Final Interview">Final Interview</option>
            </select>
          </label>

          <label>
            Interview type
            <select
              name="interviewType"
              value={form.interviewType}
              onChange={updateField}
              required
            >
              <option value="Phone">Phone</option>
              <option value="Microsoft Teams">Microsoft Teams</option>
              <option value="Zoom">Zoom</option>
              <option value="Google Meet">Google Meet</option>
              <option value="In person">In person</option>
            </select>
          </label>

          <label>
            Date and time
            <input
              name="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={form.location ?? ""}
              onChange={updateField}
              maxLength={250}
              placeholder="Remote or office address"
            />
          </label>

          <label>
            Meeting URL
            <input
              name="meetingUrl"
              type="text"
              value={form.meetingUrl ?? ""}
              onChange={updateField}
              maxLength={500}
              placeholder="https://teams.microsoft.com/..."
            />
          </label>

          <label>
            Interviewer
            <input
              name="interviewerName"
              value={form.interviewerName ?? ""}
              onChange={updateField}
              maxLength={150}
            />
          </label>
        </div>

        <label>
          Preparation notes
          <textarea
            name="notes"
            value={form.notes ?? ""}
            onChange={updateField}
            maxLength={2000}
            rows={4}
          />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Scheduling..." : "Schedule interview"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default InterviewForm;
