import { getTranslations } from "next-intl/server";
import { Topbar } from "@/components/layout/topbar";
import { CatalogTabs } from "@/components/catalog/catalog-tabs";

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");
  return (
    <>
      <Topbar title={t("catalog")} />
      <div className="px-7 py-6 flex-1">
        <CatalogTabs />
        {children}
      </div>
    </>
  );
}
