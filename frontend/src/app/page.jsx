"use client";

import { useState, useEffect, useCallback } from "react";
import { getTickets, getStats } from "@/lib/api";
import TicketList from "@/components/TicketList";
import StatsBar from "@/components/StatsBar";

/**
 * Agent dashboard page showing all tickets with filters and stats.
 *
 * @author Panji Setya Nur Prawira
 */
export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketRes, statsRes] = await Promise.all([
        getTickets(filters),
        getStats(),
      ]);

      setTickets(ticketRes.data);
      setMeta(ticketRes.meta);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 seconds to pick up background processing results.
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Agent Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and resolve AI-triaged support tickets.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Stats bar. */}
      {stats && <StatsBar stats={stats} />}

      {/* Filters. */}
      <div className="flex gap-3 mb-6">
        <FilterSelect
          label="Status"
          value={filters.status || ""}
          onChange={(v) => handleFilter("status", v)}
          options={["PENDING", "PROCESSING", "TRIAGED", "RESOLVED", "FAILED"]}
        />
        <FilterSelect
          label="Urgency"
          value={filters.urgency || ""}
          onChange={(v) => handleFilter("urgency", v)}
          options={["HIGH", "MEDIUM", "LOW"]}
        />
        <FilterSelect
          label="Category"
          value={filters.category || ""}
          onChange={(v) => handleFilter("category", v)}
          options={["BILLING", "TECHNICAL", "FEATURE_REQUEST"]}
        />
      </div>

      {/* Error state. */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Ticket list. */}
      <TicketList tickets={tickets} loading={loading} />

      {/* Pagination info. */}
      {meta && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {tickets.length} of {meta.total} tickets (Page {meta.page} of{" "}
          {meta.totalPages})
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
    >
      <option value="">All {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
