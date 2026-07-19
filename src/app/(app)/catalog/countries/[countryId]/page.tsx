import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createLeague, updateLeague, deleteLeague, setLeagueActive } from "@/actions/leagues";
import { createReferee, updateReferee, deleteReferee, setRefereeActive } from "@/actions/referees";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";
import { Breadcrumb } from "@/components/catalog/breadcrumb";

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const isOrphanBucket = countryId === "none";

  const [t, tc, country, allCountries, leagues, referees] = await Promise.all([
    getTranslations("common"),
    getTranslations("catalog"),
    isOrphanBucket ? null : prisma.country.findUnique({ where: { id: countryId } }),
    prisma.country.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.league.findMany({
      where: { countryId: isOrphanBucket ? null : countryId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.referee.findMany({
      where: { countryId: isOrphanBucket ? null : countryId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!isOrphanBucket && !country) notFound();

  const countryName = isOrphanBucket ? tc("noCountry") : country!.name;

  // The current country sorts first so the "+ Adicionar" form defaults to it (a plain
  // <select> with no explicit value selects its first <option>).
  const countryOptions = [
    ...(isOrphanBucket ? [] : [{ value: countryId, label: countryName }]),
    ...allCountries.filter((c) => c.id !== countryId).map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumb
        items={[{ label: tc("countries"), href: "/catalog/countries" }, { label: countryName }]}
      />

      <div className="grid grid-cols-2 gap-3.5 items-start">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold tracking-tight">{tc("leagues")}</h2>
          <SimpleCatalogClient
            items={leagues.map((l) => ({ id: l.id, name: l.name, countryId: l.countryId, active: l.active }))}
            fields={[
              { name: "name", label: t("name") },
              { name: "countryId", label: tc("country"), type: "select", options: countryOptions, required: false },
            ]}
            createAction={createLeague}
            updateAction={updateLeague}
            deleteAction={deleteLeague}
            setActiveAction={setLeagueActive}
            detailHrefBase={`/catalog/countries/${countryId}/leagues`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold tracking-tight">{tc("referees")}</h2>
          <SimpleCatalogClient
            items={referees.map((r) => ({ id: r.id, name: r.name, countryId: r.countryId, active: r.active }))}
            fields={[
              { name: "name", label: t("name") },
              { name: "countryId", label: tc("country"), type: "select", options: countryOptions, required: false },
            ]}
            createAction={createReferee}
            updateAction={updateReferee}
            deleteAction={deleteReferee}
            setActiveAction={setRefereeActive}
          />
        </div>
      </div>
    </div>
  );
}
