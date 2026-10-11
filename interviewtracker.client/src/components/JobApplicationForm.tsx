import { useState, type FormEvent } from "react";
import type {
  CreateJobApplication,
  JobApplication,
} from "../types/jobApplication";
import { createJobApplication } from "../services/jobApplicationService";

interface JobApplicationFormProps {
  onCreated: (application: JobApplication) => void;
  onCancel: () => void;
}

const initialForm: CreateJobApplication = {
  companyName: "",
  position: "",
  appliedDate: new Date().toISOString().split("T")[0],
  jobUrl: "",
  notes: "",
};

function JobApplicationForm({ onCreated, onCancel }: JobApplicationFormProps) {
  const [form, setForm] = useState<CreateJobApplication>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

      const createdApplication = await createJobApplication({
        ...form,
        jobUrl: form.jobUrl?.trim() || null,
        notes: form.notes?.trim() || null,
      });

      onCreated(createdApplication);
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
        <h2>Add job application</h2>

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
              type="url"
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
            {isSaving ? "Saving..." : "Save application"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default JobApplicationForm;
