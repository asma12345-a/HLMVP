import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-opacity-90">
        Go Back Home
      </Link>
    </div>
  );
}


