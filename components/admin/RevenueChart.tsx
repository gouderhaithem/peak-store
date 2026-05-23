"use client";

import { useMemo, useState } from "react";
import type { OrderRecord } from "@/lib/orders";
import { formatPrice } from "@/lib/mockdata";

interface RevenueChartProps {
  orders: OrderRecord[];
}

interface DayData {
  date: string;
  label: string;
  revenue: number;
}

const BARS = 30;
const W = 600;
const BAR_AREA_H = 100;
const AXIS_H = 24;
const H = BAR_AREA_H + AXIS_H;
const GAP = 3;
const BAR_W = (W - (BARS - 1) * GAP) / BARS;

export default function RevenueChart({ orders }: RevenueChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const days = useMemo((): DayData[] => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = BARS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const o of orders) {
      const key = o.createdAt.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + o.subtotal);
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({
      date,
      label: date.slice(8),
      revenue,
    }));
  }, [orders]);

  const maxRevenue = Math.max(...days.map((d) => d.revenue), 1);

  const hoveredDay = hovered !== null ? days[hovered] : null;
  const tooltipLeft =
    hovered !== null
      ? `${((hovered * (BAR_W + GAP) + BAR_W / 2) / W) * 100}%`
      : "0%";
  const tooltipOnRight = hovered !== null && hovered > BARS / 2;

  return (
    <div className="relative select-none">
      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="absolute z-10 bg-[#0A0A0A] text-white text-xs rounded-lg px-3 py-2 pointer-events-none whitespace-nowrap shadow-lg"
          style={{
            left: tooltipLeft,
            top: -4,
            transform: tooltipOnRight
              ? "translate(-100%, -100%)"
              : "translate(8px, -100%)",
          }}
        >
          <p className="text-[#A3A3A3] mb-0.5">{hoveredDay.date}</p>
          <p className="font-bold text-[#DC2626]">{formatPrice(hoveredDay.revenue)}</p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: 136 }}
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={0}
            y1={BAR_AREA_H * (1 - ratio)}
            x2={W}
            y2={BAR_AREA_H * (1 - ratio)}
            stroke="#F0F0F0"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {days.map((day, i) => {
          const x = i * (BAR_W + GAP);
          const barH =
            day.revenue > 0
              ? Math.max(4, (day.revenue / maxRevenue) * BAR_AREA_H)
              : 2;
          const y = BAR_AREA_H - barH;
          const active = hovered === i;

          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={2}
                fill={
                  day.revenue === 0
                    ? "#F0F0F0"
                    : active
                    ? "#B91C1C"
                    : "#DC2626"
                }
              />
              {/* Wider invisible hit area */}
              <rect
                x={x - 1}
                y={0}
                width={BAR_W + 2}
                height={H}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* X-axis labels every 5 days + last day */}
        {days.map((day, i) => {
          const showLabel = i % 5 === 0 || i === days.length - 1;
          if (!showLabel) return null;
          const x = i * (BAR_W + GAP) + BAR_W / 2;
          return (
            <text
              key={`lbl-${day.date}`}
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="#A3A3A3"
            >
              {day.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
