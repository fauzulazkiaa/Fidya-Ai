import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Compass className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">404</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        This page wandered off the curriculum. Even The Architect couldn&apos;t
        map a route here.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
        <Link href="/help">
          <Button variant="secondary">Help Center</Button>
        </Link>
      </div>
    </div>
  );
}
