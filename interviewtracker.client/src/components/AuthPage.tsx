import { useState } from "react";
import type { AuthResponse } from "../types/auth";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthPageProps {
  onLogin: (auth: AuthResponse) => void;
}

function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registrationComplete, setRegistrationComplete] = useState(false);

  if (mode === "register") {
    return (
      <RegisterForm
        onRegistered={() => {
          setRegistrationComplete(true);
          setMode("login");
        }}
        onShowLogin={() => setMode("login")}
      />
    );
  }

  return (
    <>
      {registrationComplete && (
        <div className="registration-message">
          Account created successfully. You can now log in.
        </div>
      )}

      <LoginForm
        onLogin={onLogin}
        onShowRegister={() => {
          setRegistrationComplete(false);
          setMode("register");
        }}
      />
    </>
  );
}

export default AuthPage;
