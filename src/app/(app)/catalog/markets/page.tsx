import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createMarket, updateMarket, deleteMarket, setMarketActive } from "@/actions/markets";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";

export default async function MarketsPage() {
  const [markets, tc, tCatalog, tm] = await Promise.all([
    prisma.market.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    getTranslations("common"),
    getTranslations("catalog"),
    getTranslations("marketType"),
  ]);

  const typeOptions = [
    { value: "TEAM", label: tm("TEAM") },
    { value: "PLAYER", label: tm("PLAYER") },
    { value: "REFEREE", label: tm("REFEREE") },
    { value: "GENERAL", label: tm("GENERAL") },
  ];

  return (
    <SimpleCatalogClient
      items={markets.map((m) => ({ id: m.id, name: m.name, type: m.type, active: m.active }))}
      fields={[
        { name: "name", label: tc("name") },
        { name: "type", label: tCatalog("type"), type: "select", options: typeOptions },
      ]}
      createAction={createMarket}
      updateAction={updateMarket}
      deleteAction={deleteMarket}
      setActiveAction={setMarketActive}
    />
  );
}
