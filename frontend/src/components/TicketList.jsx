"use client";

import Link from "next/link";

/**
 * Ticket list component with urgency color coding.
 * RED = HIGH urgency, GREEN = LOW urgency (as per spec).
 *
 * @author Panji Setya Nur Prawira
 */
export default function TicketList({ tickets, loading }) {
  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-xl">
        <p className="text-gray-400 text-sm">No tickets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketRow key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function TicketRow({ ticket }) {
  // Color-coded left border based on urgency (spec requirement).
  const urgencyBorder = {
    HIGH: "border-l-red-500",
    MEDIUM: "border-l-yellow-500",
    LOW: "border-l-green-500",
  };

  const urgencyBg = {
    HIGH: "bg-red-50",
    MEDIUM: "bg-white",
    LOW: "bg-white",
  };

  const statusIcon = {
    PENDING: "⏳",
    PROCESSING: "⚙️",
    TRIAGED: "🎯",
    RESOLVED: "✅",
    FAILED: "❌",
  };

  const borderClass = ticket.urgency
    ? urgencyBorder[ticket.urgency]
    : "border-l-gray-300";

  const bgClass = ticket.urgency ? urgencyBg[ticket.urgency] : "bg-white";

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <div
        className={`${bgClass} border border-gray-200 border-l-4 ${borderClass} rounded-xl p-5 hover:shadow-md transition-all cursor-pointer`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{statusIcon[ticket.status]}</span>
              <h3 className="font-semibold text-gray-900 truncate">
                {ticket.subject}
              </h3>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {ticket.customerName} &middot; {ticket.customerEmail}
            </p>
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
              {ticket.complaint}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
            {/* Badges. */}
            <div className="flex gap-1.5">
              <StatusBadge status={ticket.status} />
              {ticket.urgency && <UrgencyBadge urgency={ticket.urgency} />}
            </div>
            {ticket.category !== "UNCATEGORIZED" && (
              <span className="text-xs text-gray-400">
                {ticket.category?.replace("_", " ")}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {timeAgo(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
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
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}
    >
      {status}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const styles = {
    HIGH: "bg-red-500 text-white",
    MEDIUM: "bg-yellow-500 text-white",
    LOW: "bg-green-500 text-white",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[urgency]}`}>
      {urgency}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
