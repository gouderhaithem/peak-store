"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Globe,
  Menu,
  X,
  ChevronDown,
  Shield,
  LogOut,
  ShoppingBag,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/useFavorites";
import { useCart, CART_OPEN_EVENT } from "@/lib/useCart";
import { useLocale, LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import CartDrawer from "@/components/layout/CartDrawer";
import FavoritesDrawer from "@/components/layout/FavoritesDrawer";

interface NavChild {
  href: string;
  labelKey: string;
}

interface NavLink {
  href?: string;
  labelKey: string;
  children?: NavChild[];
  accent?: boolean;
}

const navLinks: NavLink[] = [
  { href: "/", labelKey: "nav.home" },
  {
    labelKey: "nav.men",
    children: [
      { href: "/shop?gender=men&type=shoes", labelKey: "nav.shoes" },
      { href: "/shop?gender=men&type=tshirts", labelKey: "nav.tshirts" },
      { href: "/shop?gender=men&type=hoodies", labelKey: "nav.hoodies" },
      { href: "/shop?gender=men&type=shorts", labelKey: "nav.shorts" },
      { href: "/shop?gender=men&type=accessories", labelKey: "nav.accessories" },
    ],
  },
  {
    labelKey: "nav.women",
    children: [
      { href: "/shop?gender=women&type=shoes", labelKey: "nav.shoes" },
      { href: "/shop?gender=women&type=tshirts", labelKey: "nav.tshirts" },
      { href: "/shop?gender=women&type=hoodies", labelKey: "nav.hoodies" },
      { href: "/shop?gender=women&type=leggings", labelKey: "nav.leggings" },
      { href: "/shop?gender=women&type=accessories", labelKey: "nav.accessories" },
    ],
  },
  { href: "/shop?gender=kids", labelKey: "nav.kids" },
  { href: "/shop", labelKey: "nav.shop" },
  { href: "/promo", labelKey: "nav.promo", accent: true },
  { href: "/contact", labelKey: "nav.contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  const { user, isAdmin, signOut } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const { count: wishlistCount, hydrated: favsHydrated } = useFavorites();
  const { count: cartCount, hydrated: cartHydrated } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onOpenCart = () => setCartOpen(true);
    window.addEventListener(CART_OPEN_EVENT, onOpenCart);
    return () => window.removeEventListener(CART_OPEN_EVENT, onOpenCart);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] transition-shadow duration-300",
        scrolled && "shadow-sm"
      )}
    >
      <nav className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/peak-logo.webp"
            alt="Peak Store"
            width={120}
            height={50}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden lg:flex items-center gap-10 list-none">
          {navLinks.map((link) => {
            if (link.children) {
              return (
                <li key={link.labelKey} className="relative group">
                  <button className="flex items-center gap-1 text-[#404040] hover:text-[#0A0A0A] font-medium text-[15px] transition-colors duration-200 py-2">
                    {t(link.labelKey)}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute top-full left-0 bg-white border border-[#E5E5E5] rounded-lg py-3 min-w-[180px] shadow-md opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-5 py-2.5 text-[#404040] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] text-sm font-medium transition-colors duration-150"
                      >
                        {t(child.labelKey)}
                      </Link>
                    ))}
                  </div>
                </li>
              );
            }
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href!);
            return (
              <li key={link.href}>
                <Link
                  href={link.href!}
                  className={cn(
                    "text-[#404040] hover:text-[#0A0A0A] font-medium text-[15px] transition-colors duration-200",
                    isActive && "text-[#0A0A0A]",
                    link.accent && "text-[#DC2626] hover:text-[#B91C1C]"
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right Icons */}
        <div className="flex items-center gap-5">
          {/* Language Selector */}
          <div className="relative group hidden lg:block">
            <button
              aria-label={t("nav.search")}
              className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200 py-2"
            >
              <Globe className="w-6 h-6" />
              <span className="text-xs font-semibold uppercase">{locale}</span>
            </button>
            <div className="absolute top-full right-0 bg-white border border-[#E5E5E5] rounded-lg py-3 min-w-[160px] shadow-md opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              {LOCALES.map((code) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={cn(
                    "block w-full text-left px-5 py-2.5 hover:bg-[#FAFAFA] text-sm font-medium transition-colors duration-150",
                    locale === code
                      ? "text-[#DC2626]"
                      : "text-[#404040] hover:text-[#0A0A0A]"
                  )}
                >
                  {LOCALE_LABELS[code]}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <button
            aria-label={t("nav.search")}
            className="text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Account / User menu */}
          {user ? (
            <div className="relative group hidden sm:block">
              <button
                aria-label={t("auth.myAccount")}
                className="flex items-center gap-2 text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </button>
              <div className="absolute top-full right-0 bg-white border border-[#E5E5E5] rounded-lg py-3 min-w-[220px] shadow-md opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                <div className="px-5 pb-3 mb-2 border-b border-[#E5E5E5]">
                  <p className="text-[11px] uppercase tracking-widest text-[#737373]">
                    {t("auth.signedInAs")}
                  </p>
                  <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-[#737373] truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#404040] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t("auth.myOrders")}
                </Link>
                <Link
                  href="/account/profile"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#404040] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
                >
                  <User className="w-4 h-4" />
                  {t("auth.myProfile")}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    {t("auth.adminPanel")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    if (pathname.startsWith("/admin")) {
                      window.location.href = "/";
                    }
                  }}
                  className="w-full flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#404040] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t("auth.signOut")}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={t("nav.signIn")}
              className="text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200 hidden sm:block"
            >
              <User className="w-6 h-6" />
            </Link>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => setFavsOpen(true)}
            aria-label={t("nav.favorites")}
            className="relative text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200 hidden sm:block"
          >
            <Heart className="w-6 h-6" />
            {favsHydrated && wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#DC2626] text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={t("nav.cart")}
            className="relative text-[#0A0A0A] hover:text-[#DC2626] transition-colors duration-200"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartHydrated && cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#DC2626] text-white text-[11px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="lg:hidden text-[#0A0A0A] ml-1">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
                  <Image
                    src="/peak-logo.webp"
                    alt="Peak Store"
                    width={100}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                  <button onClick={() => setMobileOpen(false)} aria-label={t("common.close")}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                  {navLinks.map((link) => {
                    if (link.children) {
                      return (
                        <div key={link.labelKey}>
                          <div className="px-6 py-3 text-[#404040] font-semibold text-sm uppercase tracking-wide">
                            {t(link.labelKey)}
                          </div>
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-10 py-2.5 text-[#525252] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] text-sm font-medium transition-colors"
                            >
                              {t(child.labelKey)}
                            </Link>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={link.href}
                        href={link.href!}
                        onClick={() => setMobileOpen(false)}
                        className="block px-6 py-3 text-[#404040] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] font-medium transition-colors"
                      >
                        {t(link.labelKey)}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-6 border-t border-[#E5E5E5]">
                  <div className="flex gap-4">
                    {LOCALES.map((code: Locale) => (
                      <button
                        key={code}
                        onClick={() => setLocale(code)}
                        className={cn(
                          "text-sm transition-colors",
                          locale === code
                            ? "text-[#DC2626] font-semibold"
                            : "text-[#737373] hover:text-[#0A0A0A]"
                        )}
                      >
                        {LOCALE_LABELS[code]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <FavoritesDrawer open={favsOpen} onOpenChange={setFavsOpen} />
    </header>
  );
}
