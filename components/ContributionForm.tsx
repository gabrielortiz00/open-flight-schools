"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CERT_OPTIONS, US_STATES } from "@/lib/constants";

interface SchoolData {
  name: string; address: string; city: string; state: string; zip: string;
  airport_id: string;
  part_61: boolean; part_141: boolean;
  website: string; phone: string; email: string; description: string;
  certifications: string[]; fleet: string[];
}

const empty: SchoolData = {
  name: "", address: "", city: "", state: "", zip: "",
  airport_id: "",
  part_61: false, part_141: false,
  website: "", phone: "", email: "", description: "",
  certifications: [], fleet: [],
};

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1D3557] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#457B9D] focus:border-transparent transition";

const labelClass = "block text-sm font-semibold text-[#1D3557] mb-1.5";

const sectionClass = "bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm";

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

    const fleet = fleetInput.split(",").map((f) => f.trim()).filter(Boolean);

    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school_id: schoolId ?? null, data: { ...form, fleet } }),
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
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3 shadow-sm">
        <div className="text-3xl">✓</div>
        <h2 className="font-display text-xl font-bold text-[#1D3557]">Submission received</h2>
        <p className="text-sm text-gray-500">
          Your {isEdit ? "edit suggestion" : "new school"} will be reviewed by our team before it goes live.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-[#457B9D] hover:text-[#1D3557] font-medium transition-colors"
        >
          ← Back to map
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Basic info */}
      <div className={sectionClass}>
        <h2 className="font-display font-semibold text-[#1D3557] text-base border-b border-gray-100 pb-3 -mt-1">
          School information
        </h2>

        <div>
          <label className={labelClass}>School name *</label>
          <input
            required value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={200}
            placeholder="e.g. Pacific Coast Flight Training"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Street address *</label>
            <input
              required value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Airport Rd"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input
              required value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Santa Monica"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State *</label>
            <select
              required value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className={inputClass}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>ZIP code *</label>
            <input
              required value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
              pattern="^\d{5}(-\d{4})?$"
              placeholder="90401"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Airport identifier</label>
            <input
              value={form.airport_id}
              onChange={(e) => set("airport_id", e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="e.g. SMO, KPAO, 52F"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">FAA identifier for the airport this school operates from</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Training type *</label>
          <div className="flex gap-4 sm:gap-6">
            {[
              { key: "part_61" as const, label: "Part 61" },
              { key: "part_141" as const, label: "Part 141" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1D3557]"
                />
                <span className="text-sm font-medium text-[#1D3557]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Brief description of the school, aircraft available, specialties, etc."
            className={inputClass + " resize-none"}
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/1000</p>
        </div>
      </div>

      {/* Contact */}
      <div className={sectionClass}>
        <h2 className="font-display font-semibold text-[#1D3557] text-base border-b border-gray-100 pb-3 -mt-1">
          Contact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Website</label>
            <input
              type="url" value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="info@school.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className={sectionClass}>
        <h2 className="font-display font-semibold text-[#1D3557] text-base border-b border-gray-100 pb-3 -mt-1">
          Certifications offered
        </h2>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map((cert) => (
            <button
              key={cert} type="button"
              onClick={() => toggleCert(cert)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                form.certifications.includes(cert)
                  ? "bg-[#1D3557] text-[#F1FAEE] border-[#1D3557]"
                  : "bg-white text-[#457B9D] border-[#A8DADC] hover:border-[#457B9D]"
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet */}
      <div className={sectionClass}>
        <h2 className="font-display font-semibold text-[#1D3557] text-base border-b border-gray-100 pb-3 -mt-1">
          Fleet
        </h2>
        <div>
          <label className={labelClass}>Aircraft types</label>
          <input
            value={fleetInput}
            onChange={(e) => setFleetInput(e.target.value)}
            placeholder="Cessna 172S, Piper Seminole, Piper Arrow IV"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-[#E63946] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-[#1D3557] text-[#F1FAEE] rounded-lg py-3 text-sm font-semibold hover:bg-[#16293f] disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting…" : isEdit ? "Submit edit for review" : "Submit school for review"}
      </button>
    </form>
  );
}