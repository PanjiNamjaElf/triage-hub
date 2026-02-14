"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/api";

/**
 * Submit new support ticket form.
 *
 * @author Panji Setya Nur Prawira
 */
export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    subject: "",
    complaint: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createTicket(form);
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err.details || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-green-800">
            Ticket Submitted
          </h3>
          <p className="text-sm text-green-600 mt-1">
            AI triage is processing your ticket. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Submit a Ticket
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Describe your issue and our AI will triage it automatically.
      </p>

      {/* Validation errors. */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
          {Array.isArray(error) ? (
            <ul className="space-y-1 text-red-700">
              {error.map((e, i) => (
                <li key={i}>
                  <strong>{e.field}:</strong> {e.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-700">{error}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Full Name"
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          placeholder="John Doe"
          required
        />
        <Field
          label="Email"
          name="customerEmail"
          type="email"
          value={form.customerEmail}
          onChange={handleChange}
          placeholder="john@example.com"
          required
        />
        <Field
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="Brief description of the issue"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Complaint Details
          </label>
          <textarea
            name="complaint"
            value={form.complaint}
            onChange={handleChange}
            placeholder="Describe your issue in detail..."
            required
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}
