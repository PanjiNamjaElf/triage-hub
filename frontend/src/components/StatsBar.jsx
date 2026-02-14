"use client";

/**
 * Dashboard stats bar showing ticket counts by status and urgency.
 *
 * @author Panji Setya Nur Prawira
 */
export default function StatsBar({ stats }) {
  const { byStatus = {}, byUrgency = {} } = stats;

  const cards = [
    {
      label: "Pending",
      value: (byStatus.PENDING || 0) + (byStatus.PROCESSING || 0),
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Triaged",
      value: byStatus.TRIAGED || 0,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Resolved",
      value: byStatus.RESOLVED || 0,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Failed",
      value: byStatus.FAILED || 0,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "🔴 High",
      value: byUrgency.HIGH || 0,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "🟡 Medium",
      value: byUrgency.MEDIUM || 0,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "🟢 Low",
      value: byUrgency.LOW || 0,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-7 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-xl p-4 text-center`}
        >
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
