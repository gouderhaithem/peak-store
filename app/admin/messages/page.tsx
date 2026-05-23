"use client";

import { useEffect, useState } from "react";
import { Mail, Search, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "General",
  order: "Order",
  returns: "Returns",
  wholesale: "Wholesale",
  other: "Other",
};

export default function AdminMessagesPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); }
        else { setMessages(data ?? []); }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm(t("admin.messages.confirmDelete"))) return;
    setDeleting(id);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);
    setDeleting(null);
    if (err) { setError(err.message); return; }
    setMessages((m) => m.filter((msg) => msg.id !== id));
    if (expanded === id) setExpanded(null);
  }

  const filtered = messages.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ar" ? "ar-DZ" : locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-1">
          {t("admin.messages.title")}
        </h1>
        <p className="text-sm text-[#525252]">{t("admin.messages.subtitle")}</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.messages.search")}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
          />
        </div>
        {!loading && (
          <span className="text-xs font-semibold text-[#737373] shrink-0">
            {filtered.length} {t("admin.messages.count")}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-[#E5E5E5] animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E5E5] py-20 text-center">
            <Mail className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#737373]">
              {query ? t("admin.messages.noResults") : t("admin.messages.empty")}
            </p>
          </div>
        ) : (
          filtered.map((msg) => {
            const isOpen = expanded === msg.id;
            return (
              <div
                key={msg.id}
                className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden"
              >
                {/* Row */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : msg.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  {/* Avatar */}
                  <span className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-sm font-bold shrink-0">
                    {msg.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#0A0A0A] text-sm">{msg.name}</span>
                      <span className="text-xs text-[#737373]">{msg.email}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#525252]">
                        {SUBJECT_LABELS[msg.subject] ?? msg.subject}
                      </span>
                    </div>
                    <p className="text-sm text-[#737373] truncate mt-0.5">{msg.message}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#A3A3A3] hidden sm:block">{dateFmt(msg.created_at)}</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-[#A3A3A3]" />
                      : <ChevronDown className="w-4 h-4 text-[#A3A3A3]" />}
                  </div>
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#F5F5F5]">
                    <p className="text-sm text-[#404040] leading-relaxed whitespace-pre-wrap mb-4">
                      {msg.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        className="h-9 px-4 inline-flex items-center gap-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {t("admin.messages.reply")}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        disabled={deleting === msg.id}
                        className={cn(
                          "h-9 px-4 inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors",
                          deleting === msg.id && "opacity-50 cursor-wait"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("admin.delete")}
                      </button>
                      <span className="text-xs text-[#A3A3A3] sm:hidden ml-auto">{dateFmt(msg.created_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
