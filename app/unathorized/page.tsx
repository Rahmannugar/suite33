export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="text-base text-[--muted-foreground] text-center mb-6">
        You do not have permission to view this page.
        <br />
        Please contact your admin or Suite33 management for access.
      </p>
      <div className="flex gap-3">
        <a
          href="/dashboard"
          className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold shadow hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </a>
        <a
          href="/"
          className="rounded-lg bg-gray-100 text-blue-700 px-6 py-3 font-semibold shadow hover:bg-blue-50 transition"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
}
