export interface MockCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  wilaya: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string; // ISO date
  avatarColor: string;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  {
    id: "c_001",
    fullName: "Mohamed Brahimi",
    email: "mohamed.brahimi@example.dz",
    phone: "0555 102 304",
    wilaya: "39",
    ordersCount: 12,
    totalSpent: 184500,
    joinedAt: "2025-08-12T10:14:00Z",
    avatarColor: "#0A0A0A",
  },
  {
    id: "c_002",
    fullName: "Lina Saadi",
    email: "lina.saadi@example.dz",
    phone: "0660 423 991",
    wilaya: "16",
    ordersCount: 8,
    totalSpent: 96400,
    joinedAt: "2025-10-03T15:42:00Z",
    avatarColor: "#DC2626",
  },
  {
    id: "c_003",
    fullName: "Yacine Bensalem",
    email: "yacine.b@example.dz",
    phone: "0770 558 010",
    wilaya: "31",
    ordersCount: 5,
    totalSpent: 53800,
    joinedAt: "2025-11-22T09:05:00Z",
    avatarColor: "#171717",
  },
  {
    id: "c_004",
    fullName: "Amel Cherif",
    email: "amel.cherif@example.dz",
    phone: "0540 211 008",
    wilaya: "25",
    ordersCount: 3,
    totalSpent: 28900,
    joinedAt: "2026-01-04T12:31:00Z",
    avatarColor: "#7c2d12",
  },
  {
    id: "c_005",
    fullName: "Rayan Mansouri",
    email: "rayan.m@example.dz",
    phone: "0670 980 223",
    wilaya: "39",
    ordersCount: 2,
    totalSpent: 22400,
    joinedAt: "2026-02-19T18:22:00Z",
    avatarColor: "#1d4ed8",
  },
  {
    id: "c_006",
    fullName: "Sara Bouzid",
    email: "sara.bouzid@example.dz",
    phone: "0555 770 421",
    wilaya: "06",
    ordersCount: 1,
    totalSpent: 11800,
    joinedAt: "2026-03-28T08:11:00Z",
    avatarColor: "#0f766e",
  },
  {
    id: "c_007",
    fullName: "Walid Belkacem",
    email: "walid.bel@example.dz",
    phone: "0660 119 832",
    wilaya: "05",
    ordersCount: 1,
    totalSpent: 9800,
    joinedAt: "2026-04-15T11:09:00Z",
    avatarColor: "#525252",
  },
];
