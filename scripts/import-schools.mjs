#!/usr/bin/env node
// Usage: node scripts/import-schools.mjs path/to/schools.csv

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !MAPBOX_TOKEN) {
  console.error("Missing required env vars. Check your .env.local file.");
  process.exit(1);
}

const VALID_CERTS = new Set(["PPL", "IR", "CPL", "MEL", "CFI", "CFII", "ATP"]);

function toSlug(name, city, state) {
  return `${name} ${city} ${state}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    // handle quoted fields with commas inside
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { fields.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    fields.push(current.trim());
    return Object.fromEntries(headers.map((h, i) => [h, fields[i] ?? ""]));
  });
}

async function geocode(address, city, state, zip) {
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}, USA`);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const [lng, lat] = json.features?.[0]?.center ?? [];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lng, lat };
}

function parseBool(val) {
  return ["true", "1", "yes"].includes(String(val).toLowerCase().trim());
}

function parseList(val) {
  if (!val) return [];
  return val.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
}

async function importRow(row, index) {
  const label = `Row ${index + 2} (${row.name || "?"})`;

  // validate required fields
  if (!row.name?.trim()) return console.error(`${label}: missing name`);
  if (!row.address?.trim()) return console.error(`${label}: missing address`);
  if (!row.city?.trim()) return console.error(`${label}: missing city`);
  if (!row.state?.trim()) return console.error(`${label}: missing state`);
  if (!row.zip?.trim()) return console.error(`${label}: missing zip`);
  if (!parseBool(row.part_61) && !parseBool(row.part_141))
    return console.error(`${label}: part_61 and part_141 are both false — at least one required`);

  // geocode
  const coords = await geocode(row.address, row.city, row.state, row.zip);
  if (!coords) return console.error(`${label}: geocoding failed — check address`);

  const certifications = parseList(row.certifications).filter((c) => VALID_CERTS.has(c));
  const fleet = row.fleet ? row.fleet.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // insert school
  const { data: school, error } = await supabase
    .from("schools")
    .insert({
      name: row.name.trim(),
      address: row.address.trim(),
      city: row.city.trim(),
      state: row.state.trim().toUpperCase(),
      zip: row.zip.trim(),
      airport_id: row.airport_id?.trim().toUpperCase() || null,
      slug: toSlug(row.name.trim(), row.city.trim(), row.state.trim()),
      part_61: parseBool(row.part_61),
      part_141: parseBool(row.part_141),
      website: row.website?.trim() || null,
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      description: row.description?.trim() || null,
      location: `POINT(${coords.lng} ${coords.lat})`,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return console.error(`${label}: insert failed — ${error.message}`);

  if (certifications.length > 0) {
    await supabase.from("certifications").insert(
      certifications.map((cert_type) => ({ school_id: school.id, cert_type }))
    );
  }

  if (fleet.length > 0) {
    await supabase.from("fleet").insert(
      fleet.map((aircraft) => ({ school_id: school.id, aircraft }))
    );
  }

  console.log(`✓ ${label} imported (id: ${school.id})`);
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-schools.mjs path/to/schools.csv");
    process.exit(1);
  }

  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  console.log(`Found ${rows.length} rows — importing...\n`);

  for (let i = 0; i < rows.length; i++) {
    await importRow(rows[i], i);
  }

  console.log("\nDone.");
}

main().catch((err) => { console.error(err); process.exit(1); });