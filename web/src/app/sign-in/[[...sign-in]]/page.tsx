import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Log in" };

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your curriculum."
    >
      <SignIn
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#4f46e5",
            colorBackground: "#ffffff",
            borderRadius: "1rem",
            fontFamily: "var(--font-geist-sans), sans-serif",
          },
          elements: {
            card: "bg-transparent shadow-none border-none",
            socialButtonsBlockButton:
              "border-card-border hover:bg-tick-empty/40 rounded-full",
            formButtonPrimary: "rounded-full shadow-none",
            identifierField: "rounded-xl",
            footerActionLink: "text-accent",
          },
        }}
      />
    </AuthShell>
  );
}
