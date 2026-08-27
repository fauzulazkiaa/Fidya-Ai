import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Four minutes to your first personalized syllabus."
    >
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
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
