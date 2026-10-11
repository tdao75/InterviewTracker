import { useState, type FormEvent } from "react";
import { login } from "../services/authService";
import type { AuthResponse } from "../types/auth";

interface LoginFormProps {
  onLogin: (auth: AuthResponse) => void;
  onShowRegister: () => void;
}

function LoginForm({ onLogin, onShowRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const auth = await login({
        email,
        password,
      });

      onLogin(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to log in.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <h1>Interview Tracker</h1>
          <p>Log in to manage your job search.</p>
        </div>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
          <button
            type="button"
            className="auth-link-button"
            onClick={onShowRegister}
          >
            Don&apos;t have an account? Create one
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginForm;
