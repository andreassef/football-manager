import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createCountry, updateCountry, deleteCountry, setCountryActive } from "@/actions/countries";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";

export default async function CountriesPage() {
  const [countries, orphanLeagues, orphanReferees, tc, t] = await Promise.all([
    prisma.country.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.league.count({ where: { countryId: null } }),
    prisma.referee.count({ where: { countryId: null } }),
    getTranslations("common"),
    getTranslations("catalog"),
  ]);

  const orphanCount = orphanLeagues + orphanReferees;

  return (
    <div className="flex flex-col gap-3.5">
      {orphanCount > 0 && (
        <Link
          href="/catalog/countries/none"
          className="bg-card border border-border p-3.5 flex items-center justify-between text-[12.5px] hover:border-teal"
        >
          <span className="text-teal underline underline-offset-2">{t("noCountry")}</span>
          <span className="text-text-3">{t("noCountryCount", { count: orphanCount })}</span>
        </Link>
      )}
      <SimpleCatalogClient
        items={countries.map((c) => ({ id: c.id, name: c.name, active: c.active }))}
        fields={[{ name: "name", label: tc("name") }]}
        createAction={createCountry}
        updateAction={updateCountry}
        deleteAction={deleteCountry}
        setActiveAction={setCountryActive}
        detailHrefBase="/catalog/countries"
      />
    </div>
  );
}
