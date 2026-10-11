import { useState, type ChangeEvent, type FormEvent } from "react";
import { updateInterview } from "../services/interviewService";
import type { Interview, UpdateInterview } from "../types/interview";

interface EditInterviewFormProps {
  interview: Interview;
  onUpdated: (interview: Interview) => void;
  onCancel: () => void;
}

function EditInterviewForm({
  interview,
  onUpdated,
  onCancel,
}: EditInterviewFormProps) {
  const [form, setForm] = useState<UpdateInterview>({
    interviewType: interview.interviewType,
    stage: interview.stage,
    scheduledAt: interview.scheduledAt.substring(0, 16),
    location: interview.location ?? "",
    meetingUrl: interview.meetingUrl ?? "",
    interviewerName: interview.interviewerName ?? "",
    notes: interview.notes ?? "",
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

      const request: UpdateInterview = {
        ...form,
        location: form.location?.trim() || null,
        meetingUrl: form.meetingUrl?.trim() || null,
        interviewerName: form.interviewerName?.trim() || null,
        notes: form.notes?.trim() || null,
      };

      await updateInterview(interview.id, request);

      onUpdated({
        ...interview,
        ...request,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update the interview.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="form-card edit-interview-form">
      <div className="form-heading">
        <div>
          <h2>Edit interview</h2>
          <p>
            {interview.position} at {interview.companyName}
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
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default EditInterviewForm;
