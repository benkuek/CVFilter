import AuthButton from "@/components/auth-button";
import JobMatcher from "@/components/job-matcher";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto space-y-8">
        <AuthButton />
        <JobMatcher />
      </main>
    </div>
  );
}
