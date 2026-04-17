import { createClient } from "@supabase/supabase-js";
import schools from "../data/seed-schools.json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function seed() {
  console.log(`Seeding ${schools.length} schools...`);

  for (const school of schools) {
    const { certifications, fleet, pricing, lat, lng, ...schoolData } = school;

    // insert school
    const { data: inserted, error } = await supabase
      .from("schools")
      .insert({
        ...schoolData,
        location: `POINT(${lng} ${lat})`,
        status: "published",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error(`Failed to insert ${school.name}:`, error?.message);
      continue;
    }

    const schoolId = inserted.id;

    // insert certifications
    if (certifications.length) {
      const { error: certError } = await supabase.from("certifications").insert(
        certifications.map((cert_type) => ({ school_id: schoolId, cert_type }))
      );
      if (certError) console.error(`  Certs error for ${school.name}:`, certError.message);
    }

    // insert fleet
    if (fleet.length) {
      const { error: fleetError } = await supabase.from("fleet").insert(
        fleet.map((aircraft) => ({ school_id: schoolId, aircraft }))
      );
      if (fleetError) console.error(`  Fleet error for ${school.name}:`, fleetError.message);
    }

    // insert pricing
    if (pricing.length) {
      const { error: pricingError } = await supabase.from("pricing").insert(
        pricing.map((p) => ({ school_id: schoolId, ...p }))
      );
      if (pricingError) console.error(`  Pricing error for ${school.name}:`, pricingError.message);
    }

    console.log(`  ✓ ${school.name}`);
  }

  console.log("Done.");
}

seed();