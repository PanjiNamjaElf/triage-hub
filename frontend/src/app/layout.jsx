import "./globals.css";

/**
 * Root layout with sidebar navigation.
 *
 * @author Panji Setya Nur Prawira
 */
export const metadata = {
  title: "AI Triage Hub",
  description: "AI-powered support ticket triage and recovery dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          {/* Sidebar. */}
          <aside className="w-64 bg-gray-900 text-white flex-shrink-0">
            <div className="p-6">
              <h1 className="text-xl font-bold tracking-tight">
                🎯 Triage Hub
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                AI Support Dashboard
              </p>
            </div>
            <nav className="px-4 space-y-1">
              <a
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span>📋</span> Dashboard
              </a>
              <a
                href="/submit"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span>➕</span> Submit Ticket
              </a>
            </nav>
          </aside>

          {/* Main content. */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
