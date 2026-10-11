import { useState, type ChangeEvent, type FormEvent } from "react";
import { updateJobApplication } from "../services/jobApplicationService";
import type {
  JobApplication,
  UpdateJobApplication,
} from "../types/jobApplication";

interface EditJobApplicationFormProps {
  application: JobApplication;
  onUpdated: (application: JobApplication) => void;
  onCancel: () => void;
}

function EditJobApplicationForm({
  application,
  onUpdated,
  onCancel,
}: EditJobApplicationFormProps) {
  const [form, setForm] = useState<UpdateJobApplication>({
    companyName: application.companyName,
    position: application.position,
    status: application.status,
    appliedDate: application.appliedDate.substring(0, 10),
    jobUrl: application.jobUrl ?? "",
    notes: application.notes ?? "",
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

      const request: UpdateJobApplication = {
        ...form,
        jobUrl: form.jobUrl?.trim() || null,
        notes: form.notes?.trim() || null,
      };

      await updateJobApplication(application.id, request);

      onUpdated({
        id: application.id,
        ...request,
      });
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
        <h2>Edit job application</h2>

        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Company name
            <input
              name="companyName"
              value={form.companyName}
              onChange={updateField}
              maxLength={150}
              required
            />
          </label>

          <label>
            Position
            <input
              name="position"
              value={form.position}
              onChange={updateField}
              maxLength={150}
              required
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={updateField}
              required
            >
              <option value="Applied">Applied</option>
              <option value="HR Interview">HR Interview</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Final Interview">Final Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </label>

          <label>
            Applied date
            <input
              name="appliedDate"
              type="date"
              value={form.appliedDate}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Job posting URL
            <input
              name="jobUrl"
              type="text"
              value={form.jobUrl ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  jobUrl: event.target.value,
                }))
              }
              maxLength={500}
              placeholder="https://example.com/job"
            />
          </label>
        </div>

        <label>
          Notes
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

export default EditJobApplicationForm;
