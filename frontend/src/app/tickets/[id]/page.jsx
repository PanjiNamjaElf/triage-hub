"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getTicket, resolveTicket, retryTriage } from "@/lib/api";

/**
 * Ticket detail page.
 * Allows agents to view AI triage results, edit the draft, and resolve tickets.
 *
 * @author Panji Setya Nur Prawira
 */
export default function TicketDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let interval;

    async function fetchTicket() {
      try {
        const res = await getTicket(id);
        setTicket(res.data);
        setDraft(res.data.aiDraft || res.data.resolvedReply || "");

        // Stop polling once ticket reaches a terminal state.
        if (["TRIAGED", "RESOLVED", "FAILED"].includes(res.data.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        setError(err.message);
        clearInterval(interval);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();

    // Poll while ticket is still being processed.
    interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleResolve = async () => {
    if (!draft.trim()) return;
    setResolving(true);
    setError(null);

    try {
      const res = await resolveTicket(id, draft);
      setTicket(res.data);
      setResolved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);

    try {
      await retryTriage(id);
      setTicket((prev) => ({ ...prev, status: "PENDING" }));
      setLoading(true);

      // Re-fetch after a short delay.
      setTimeout(async () => {
        const res = await getTicket(id);
        setTicket(res.data);
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full mb-3" />
          <p className="text-sm text-gray-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700">{error || "Ticket not found."}</p>
        </div>
      </div>
    );
  }

  const isProcessing = ["PENDING", "PROCESSING"].includes(ticket.status);

  return (
    <div className="p-8 max-w-4xl">
      {/* Back button. */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* Header. */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{ticket.subject}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.customerName} &middot; {ticket.customerEmail}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          {ticket.urgency && <UrgencyBadge urgency={ticket.urgency} />}
          {ticket.category !== "UNCATEGORIZED" && (
            <CategoryBadge category={ticket.category} />
          )}
        </div>
      </div>

      {/* Processing indicator. */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full" />
          <p className="text-sm text-blue-700">
            AI is processing this ticket. Results will appear automatically...
          </p>
        </div>
      )}

      {/* Error state. */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Resolved success. */}
      {resolved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Ticket resolved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer complaint. */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Customer Complaint
          </h3>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {ticket.complaint}
          </p>

          {/* AI metadata. */}
          {ticket.sentimentScore && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                AI Analysis
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Sentiment"
                  value={`${ticket.sentimentScore}/10`}
                  color={ticket.sentimentScore <= 3 ? "red" : ticket.sentimentScore <= 6 ? "yellow" : "green"}
                />
                <MetricCard label="Category" value={ticket.category?.replace("_", " ")} />
                <MetricCard
                  label="Urgency"
                  value={ticket.urgency}
                  color={ticket.urgency === "HIGH" ? "red" : ticket.urgency === "MEDIUM" ? "yellow" : "green"}
                />
              </div>
            </div>
          )}

          {/* Error details for failed tickets. */}
          {ticket.status === "FAILED" && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-red-600 mb-3">
                AI processing failed: {ticket.errorMessage}
              </p>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 disabled:opacity-50"
              >
                {retrying ? "Retrying..." : "⟳ Retry AI Triage"}
              </button>
            </div>
          )}
        </div>

        {/* Right: AI draft / Response editor. */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {ticket.status === "RESOLVED" ? "Sent Reply" : "AI Draft Response"}
          </h3>

          {isProcessing ? (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-400">
                Waiting for AI draft...
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={ticket.status === "RESOLVED"}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed resize-y focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              {ticket.status !== "RESOLVED" && ticket.aiDraft && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleResolve}
                    disabled={resolving || !draft.trim()}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    {resolving ? "Resolving..." : "✓ Resolve Ticket"}
                  </button>
                  <button
                    onClick={() => setDraft(ticket.aiDraft)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Reset Draft
                  </button>
                </div>
              )}
            </>
          )}

          {/* Timeline. */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Timeline
            </h4>
            <div className="space-y-2 text-xs text-gray-500">
              <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
              {ticket.resolvedAt && (
                <p>Resolved: {new Date(ticket.resolvedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    TRIAGED: "bg-purple-100 text-purple-700",
    RESOLVED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const styles = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[urgency]}`}>
      {urgency}
    </span>
  );
}

function CategoryBadge({ category }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {category?.replace("_", " ")}
    </span>
  );
}

function MetricCard({ label, value, color }) {
  const colorMap = {
    red: "text-red-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${colorMap[color] || "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
