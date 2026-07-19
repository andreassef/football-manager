import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createBookmaker, updateBookmaker, deleteBookmaker, setBookmakerActive } from "@/actions/bookmakers";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";

export default async function BookmakersPage() {
  const [bookmakers, tc] = await Promise.all([
    prisma.bookmaker.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    getTranslations("common"),
  ]);

  return (
    <SimpleCatalogClient
      items={bookmakers.map((b) => ({ id: b.id, name: b.name, active: b.active }))}
      fields={[{ name: "name", label: tc("name") }]}
      createAction={createBookmaker}
      updateAction={updateBookmaker}
      deleteAction={deleteBookmaker}
      setActiveAction={setBookmakerActive}
    />
  );
}
