"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";
import { submitContact } from "@/app/actions/contact";

const InstagramSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function ContactPage() {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const contactInfo = [
    {
      icon: MapPin,
      label: t("contact.visitStore"),
      value: t("contact.visitStoreValue"),
      sub: t("contact.visitStoreSub"),
    },
    {
      icon: Phone,
      label: t("contact.callUs"),
      value: t("contact.callUsValue"),
      sub: t("contact.callUsSub"),
    },
    {
      icon: Mail,
      label: t("contact.emailUs"),
      value: t("contact.emailUsValue"),
      sub: t("contact.emailUsSub"),
    },
    {
      icon: Clock,
      label: t("contact.openingHours"),
      value: t("contact.openingHoursValue"),
      sub: t("contact.openingHoursSub"),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = await submitContact({ name, email, subject, message });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSent(true);
    setName("");
    setEmail("");
    setSubject("general");
    setMessage("");
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0A0A0A] text-white py-20 md:py-28 overflow-hidden">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-32 left-10 w-80 h-80 bg-[#DC2626] rounded-full blur-3xl opacity-10" />
          <div className="relative max-w-[1400px] mx-auto px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-4">
              {t("contact.hero")}
            </span>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              {t("contact.title1")}{" "}
              <span className="text-[#DC2626]">{t("contact.title2")}</span>
              {t("contact.title3")}
            </h1>
            <p className="text-lg md:text-xl text-[#D4D4D4] max-w-2xl mx-auto">
              {t("contact.subtitle")}
            </p>
          </div>
        </section>

        {/* Info cards */}
        <section className="max-w-[1400px] mx-auto px-6 -mt-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">
                  {label}
                </p>
                <p className="text-[#0A0A0A] font-semibold text-lg mb-1">
                  {value}
                </p>
                <p className="text-sm text-[#737373]">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form + Map */}
        <section className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 bg-white border border-[#E5E5E5] rounded-2xl p-8 md:p-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
                {t("contact.formTitle")}
              </h2>
              <p className="text-[#737373] mb-8">{t("contact.formSubtitle")}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-[#404040] mb-2"
                    >
                      {t("contact.fullName")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t("contact.fullNamePlaceholder")}
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-sm font-semibold text-[#404040] mb-2"
                    >
                      {t("contact.emailLabel")}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-[#404040] mb-2"
                  >
                    {t("contact.subject")}
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  >
                    <option value="general">{t("contact.subjects.general")}</option>
                    <option value="order">{t("contact.subjects.order")}</option>
                    <option value="returns">{t("contact.subjects.returns")}</option>
                    <option value="wholesale">{t("contact.subjects.wholesale")}</option>
                    <option value="other">{t("contact.subjects.other")}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-[#404040] mb-2"
                  >
                    {t("contact.message")}
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    placeholder={t("contact.messagePlaceholder")}
                    className="w-full px-4 py-3 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto h-12 px-8 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {t("contact.sending")}
                    </>
                  ) : (
                    <>
                      {t("contact.sendMessage")}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {sent && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                    {t("contact.sent")}
                  </div>
                )}
              </form>
            </div>

            {/* Side panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden border border-[#E5E5E5] aspect-square lg:aspect-auto lg:h-[340px] bg-[#FAFAFA]">
                <iframe
                  title={t("contact.mapTitle")}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=6.85%2C33.34%2C6.91%2C33.39&amp;layer=mapnik&amp;marker=33.3683%2C6.8674"
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>

              <div className="bg-[#0A0A0A] text-white rounded-2xl p-8">
                <h3 className="font-heading text-xl font-bold mb-2">
                  {t("contact.quickerTitle")}
                </h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed mb-6">
                  {t("contact.quickerText")}
                </p>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/213780137475"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#262626] hover:bg-[#DC2626] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] group-hover:bg-white/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t("contact.whatsappLabel")}
                      </p>
                      <p className="text-xs text-[#A3A3A3] group-hover:text-white/80">
                        {t("contact.whatsappSub")}
                      </p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#262626] hover:bg-[#DC2626] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] group-hover:bg-white/20 flex items-center justify-center">
                      <InstagramSvg />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t("contact.instagramLabel")}
                      </p>
                      <p className="text-xs text-[#A3A3A3] group-hover:text-white/80">
                        {t("contact.instagramSub")}
                      </p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#262626] hover:bg-[#DC2626] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] group-hover:bg-white/20 flex items-center justify-center">
                      <FacebookSvg />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t("contact.facebookLabel")}
                      </p>
                      <p className="text-xs text-[#A3A3A3] group-hover:text-white/80">
                        {t("contact.facebookSub")}
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ teaser */}
        <section className="bg-[#FAFAFA] py-16">
          <div className="max-w-[1400px] mx-auto px-6 text-center">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
              {t("contact.quickAnswersTitle")}
            </h3>
            <p className="text-[#737373] mb-6">
              {t("contact.quickAnswersText")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/shop"
                className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
              >
                {t("contact.visitShop")}
              </Link>
              <Link
                href="/promo"
                className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
              >
                {t("contact.seePromos")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
