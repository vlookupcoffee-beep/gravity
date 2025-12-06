export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gravity Dashboard</h1>
        <p className="text-xl mb-8">Sistem Berhasil Deploy!</p>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Buka Dashboard
        </a>
      </div>
    </main>
  );
}
