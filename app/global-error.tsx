'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
