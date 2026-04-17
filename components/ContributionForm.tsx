"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CERT_OPTIONS = ["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface SchoolData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  part_61: boolean;
  part_141: boolean;
  website: string;
  phone: string;
  email: string;
  description: string;
  certifications: string[];
  fleet: string[];
}

const empty: SchoolData = {
  name: "", address: "", city: "", state: "", zip: "",
  part_61: false, part_141: false,
  website: "", phone: "", email: "", description: "",
  certifications: [], fleet: [],
};

export default function ContributionForm({
  schoolId,
  initial,
}: {
  schoolId?: string;
  initial?: Partial<SchoolData>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SchoolData>({ ...empty, ...initial });
  const [fleetInput, setFleetInput] = useState(initial?.fleet?.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isEdit = !!schoolId;

  function set<K extends keyof SchoolData>(key: K, value: SchoolData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCert(cert: string) {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fleet = fleetInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: schoolId ?? null,
        data: { ...form, fleet },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Submission received</h2>
        <p className="text-sm text-gray-500">
          Thanks! Your {isEdit ? "edit" : "new school"} will be reviewed before it goes live.
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic info */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">School information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School name *</label>
          <input
            required value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={200}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              required value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              required value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select
              required value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code *</label>
            <input
              required value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
              pattern="^\d{5}(-\d{4})?$"
              placeholder="12345"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Training type *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox" checked={form.part_61}
                onChange={(e) => set("part_61", e.target.checked)}
              />
              Part 61
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox" checked={form.part_141}
                onChange={(e) => set("part_141", e.target.checked)}
              />
              Part 141
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Brief description of the school"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url" value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="info@school.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Certifications offered</h2>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map((cert) => (
            <button
              key={cert} type="button"
              onClick={() => toggleCert(cert)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                form.certifications.includes(cert)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Fleet</h2>
        <p className="text-xs text-gray-400 mb-3">Comma-separated list of aircraft</p>
        <input
          value={fleetInput}
          onChange={(e) => setFleetInput(e.target.value)}
          placeholder="Cessna 172, Piper Seminole, Piper Arrow"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting..." : isEdit ? "Submit edit for review" : "Submit school for review"}
      </button>
    </form>
  );
}
