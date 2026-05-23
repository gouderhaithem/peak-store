import type { Product } from "@/lib/mockdata";

export type SizeKind = "shoe" | "clothing" | "none";

// Adult EU shoe sizes.
export const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];
// Kids EU shoe sizes — roughly age 5 through 12. Tweak the range if the
// buyer ever stocks younger toddlers or older youth.
export const KIDS_SHOE_SIZES = ["28", "29", "30", "31", "32", "33", "34", "35"];

// Adult apparel sizing.
export const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL"];
// Kids apparel uses age-based labels rather than letter sizes.
export const KIDS_CLOTHING_SIZES = ["4Y", "6Y", "8Y", "10Y", "12Y", "14Y"];

export function getSizeKind(type: Product["type"]): SizeKind {
  if (type === "apparel") return "clothing";
  if (
    type === "running" ||
    type === "basketball" ||
    type === "casual" ||
    type === "training"
  ) {
    return "shoe";
  }
  return "none";
}

export function getSizeOptions(
  type: Product["type"],
  gender?: Product["gender"]
): string[] {
  const kind = getSizeKind(type);
  if (kind === "shoe") {
    return gender === "kids" ? KIDS_SHOE_SIZES : SHOE_SIZES;
  }
  if (kind === "clothing") {
    return gender === "kids" ? KIDS_CLOTHING_SIZES : CLOTHING_SIZES;
  }
  return [];
}
