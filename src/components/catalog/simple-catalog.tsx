"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";

export type CatalogField = {
  name: string;
  label: string;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
  /** Selects default to required; set false to allow an empty "—" choice (e.g. optional country). */
  required?: boolean;
};

export type CatalogItem = { id: string; active: boolean; [key: string]: string | boolean | null };

type ActionResult = { error: unknown } & Record<string, unknown>;

export function SimpleCatalogClient({
  items,
  fields,
  createAction,
  updateAction,
  deleteAction,
  setActiveAction,
  detailHrefBase,
}: {
  items: CatalogItem[];
  fields: CatalogField[];
  createAction: (formData: FormData) => Promise<ActionResult>;
  updateAction: (id: string, formData: FormData) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
  setActiveAction: (id: string, active: boolean) => Promise<ActionResult>;
  /** When set (e.g. "/catalog/countries"), the first field's value links to `${detailHrefBase}/${item.id}`. */
  detailHrefBase?: string;
}) {
  const t = useTranslations("common");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archivedNotice, setArchivedNotice] = useState<Record<string, number>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  const archivedCount = items.filter((i) => !i.active).length;
  const visibleItems = showArchived ? items : items.filter((i) => i.active);

  function renderInputs(defaults?: CatalogItem) {
    return fields.map((f) => {
      const value = defaults?.[f.name] ?? "";
      if (f.type === "select") {
        const isRequired = f.required !== false;
        return (
          <Field key={f.name} label={f.label}>
            <Select name={f.name} defaultValue={(value as string) ?? undefined} required={isRequired}>
              {!isRequired && <option value="">—</option>}
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        );
      }
      return (
        <Field key={f.name} label={f.label}>
          <Input name={f.name} defaultValue={(value as string) ?? ""} required={f.name === "name"} />
        </Field>
      );
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex justify-between items-center">
        {archivedCount > 0 ? (
          <label className="flex items-center gap-2 text-xs text-text-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-teal"
            />
            {t("showArchived")} ({archivedCount})
          </label>
        ) : (
          <span />
        )}
        {!adding && (
          <Button onClick={() => setAdding(true)}>+ {t("add")}</Button>
        )}
      </div>

      {adding && (
        <form
          action={(formData) =>
            startTransition(async () => {
              const res = await createAction(formData);
              if (!res.error) setAdding(false);
            })
          }
          className="bg-card border border-border p-4 flex flex-wrap gap-3 items-end"
        >
          {renderInputs()}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border">
        <table className="w-full text-[12.5px] border-collapse">
          <tbody>
            {visibleItems.length === 0 && (
              <tr>
                <td className="p-4 text-text-3">{t("empty")}</td>
              </tr>
            )}
            {visibleItems.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} className="border-b border-grid last:border-0">
                  <td className="p-2.5" colSpan={fields.length + 1}>
                    <form
                      action={(formData) =>
                        startTransition(async () => {
                          const res = await updateAction(item.id, formData);
                          if (!res.error) setEditingId(null);
                        })
                      }
                      className="flex flex-wrap gap-3 items-end"
                    >
                      {renderInputs(item)}
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isPending}>
                          {t("save")}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className={`border-b border-grid last:border-0 ${!item.active ? "opacity-60" : ""}`}>
                  {fields.map((f, i) => {
                    const displayValue =
                      f.type === "select"
                        ? f.options?.find((o) => o.value === item[f.name])?.label ?? item[f.name]
                        : item[f.name] || "—";
                    return (
                      <td key={f.name} className="p-2.5">
                        {i === 0 && !item.active && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-void-bg text-text-2 mr-2 align-middle">
                            {t("archived")}
                          </span>
                        )}
                        {i === 0 && detailHrefBase ? (
                          <Link href={`${detailHrefBase}/${item.id}`} className="text-teal underline underline-offset-2">
                            {displayValue}
                          </Link>
                        ) : (
                          displayValue
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2.5 text-right whitespace-nowrap">
                    {archivedNotice[item.id] !== undefined && (
                      <div className="text-[10.5px] text-text-3 mb-1">
                        {t("archivedAfterDelete", { count: archivedNotice[item.id] })}
                      </div>
                    )}
                    {item.active ? (
                      <>
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="text-teal underline underline-offset-2 text-xs mr-3 cursor-pointer"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() =>
                            startTransition(async () => {
                              const res = await deleteAction(item.id);
                              if (res.archived) {
                                setArchivedNotice((m) => ({ ...m, [item.id]: (res.count as number) ?? 0 }));
                              }
                            })
                          }
                          className="text-text-2 underline underline-offset-2 text-xs cursor-pointer hover:text-text-1"
                        >
                          {t("archive")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="text-teal underline underline-offset-2 text-xs mr-3 cursor-pointer"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => startTransition(async () => { await setActiveAction(item.id, true); })}
                          className="text-teal underline underline-offset-2 text-xs cursor-pointer"
                        >
                          {t("reactivate")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
