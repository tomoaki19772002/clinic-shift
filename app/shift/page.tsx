"use client";
import { useState, useMemo } from "react";

// ============================================================
// TYPES
// ============================================================
type Slot = "am" | "pm";
type Role =
  | "ナース"
  | "手術"
  | "検査"
  | "シュライバー①"
  | "シュライバー②"
  | "受付"
  | "受付・レジ"
  | "手術補助"
  | "洗浄"
  | "診察"
  | "レンズ"
  | "休"
  | "有休"
  | "";

type StaffType =
  | "nurse"
  | "orthoptist"
  | "medical1"
  | "medical2"
  | "medical3"
  | "medical4"
  | "medical5"
  | "medical6";

interface StaffDef {
  id: string;
  name: string;
  group: string;
  type: StaffType;
  fulltime: boolean;
  skills: Role[];
  canWash: boolean;
  fixed?: { [dow: number]: Slot[] }; // dow: 0=Sun,1=Mon,...,6=Sat
  weekShifts?: number;
}

interface Cell {
  working: boolean;
  role: Role;
  fixed?: boolean; // fixed schedule slot
}

type DaySch = { am: Cell; pm: Cell };
type Schedule = Record<string, Record<string, DaySch>>; // staffId -> dateStr -> DaySch

// ============================================================
// CONSTANTS
// ============================================================
const DOW_JP = ["日", "月", "火", "水", "木", "金", "土"];

const HOLIDAYS = new Set([
  // 2025
  "2025-01-01", "2025-01-13", "2025-02-11", "2025-02-23", "2025-02-24",
  "2025-03-20", "2025-04-29", "2025-05-03", "2025-05-04", "2025-05-05", "2025-05-06",
  "2025-07-21", "2025-08-11", "2025-09-15", "2025-09-23", "2025-10-13",
  "2025-11-03", "2025-11-23", "2025-11-24",
  // 2026
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23",
  "2026-03-20", "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06",
  "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-10-12", "2026-11-03", "2026-11-23",
]);

// テーブルセル内の短縮表示名（内部ロール名はそのまま）
const ROLE_SHORT: Record<string, string> = {
  "ナース":        "ナ",
  "手術":          "手",
  "検査":          "検",
  "シュライバー①": "①",
  "シュライバー②": "②",
  "受付":          "受",
  "受付・レジ":    "レ",
  "手術補助":      "手",
  "洗浄":          "洗",
  "診察":          "診",
  "レンズ":        "Le",
  "有休":          "有",
};

const ROLE_CLS: Record<string, string> = {
  ナース:        "bg-rose-100 text-rose-700",
  手術:          "bg-red-200 text-red-800",
  検査:          "bg-sky-100 text-sky-700",
  "シュライバー①": "bg-violet-100 text-violet-700",
  "シュライバー②": "bg-violet-200 text-violet-800",
  受付:          "bg-emerald-100 text-emerald-700",
  "受付・レジ":  "bg-emerald-100 text-emerald-700",
  手術補助:      "bg-amber-100 text-amber-700",
  洗浄:          "bg-orange-100 text-orange-700",
  診察:          "bg-teal-100 text-teal-700",
  レンズ:        "bg-cyan-100 text-cyan-700",
  休:            "bg-gray-100 text-gray-400",
  有休:          "bg-pink-100 text-pink-600",
  "":            "",
};

// ============================================================
// STAFF DATA
// ============================================================
const STAFF: StaffDef[] = [
  // ① ナース
  {
    id: "murata", name: "村田", type: "nurse", group: "①ナース",
    fulltime: true, skills: ["ナース", "手術"], canWash: false,
  },
  {
    id: "hirano", name: "平野", type: "nurse", group: "①ナース",
    fulltime: false, skills: ["ナース"], canWash: false,
    // 月(1)・水(3) 午前, 火(2)・木(4) 午後
    fixed: { 1: ["am"], 3: ["am"], 2: ["pm"], 4: ["pm"] },
  },
  // ② 視能訓練士
  {
    id: "komada", name: "駒田", type: "orthoptist", group: "②視能訓練士",
    fulltime: true, skills: ["検査", "レンズ"], canWash: false,
  },
  {
    id: "hasegawa", name: "長谷川", type: "orthoptist", group: "②視能訓練士",
    fulltime: true, skills: ["検査", "洗浄"], canWash: true,
  },
  {
    id: "nishibata", name: "西畠", type: "orthoptist", group: "②視能訓練士",
    fulltime: true, skills: ["検査", "洗浄"], canWash: true,
  },
  {
    id: "okamura", name: "岡村", type: "orthoptist", group: "②視能訓練士",
    fulltime: false, skills: ["検査"], canWash: false,
    // 月〜金(1-5) 午前, 木(4) 午後
    fixed: { 1: ["am"], 2: ["am"], 3: ["am"], 4: ["am", "pm"], 5: ["am"] },
  },
  // ③ 医療事務1
  {
    id: "matsunaga", name: "松永", type: "medical1", group: "③医療事務1",
    fulltime: true, skills: ["シュライバー①", "シュライバー②", "受付", "検査", "手術補助"], canWash: false,
  },
  {
    id: "kinoshita", name: "木下", type: "medical1", group: "③医療事務1",
    fulltime: true, skills: ["シュライバー①", "シュライバー②", "受付", "検査", "手術補助", "洗浄"], canWash: true,
  },
  {
    id: "ohama", name: "大濱", type: "medical1", group: "③医療事務1",
    fulltime: true, skills: ["シュライバー①", "シュライバー②", "受付", "検査", "手術補助", "洗浄"], canWash: true,
  },
  // ④ 医療事務2
  {
    id: "taniguchi", name: "谷口", type: "medical2", group: "④医療事務2",
    fulltime: true, skills: ["シュライバー①", "シュライバー②", "受付", "手術補助"], canWash: false,
  },
  // ⑤ 医療事務3
  {
    id: "watanabe", name: "渡邉", type: "medical3", group: "⑤医療事務3",
    fulltime: true, skills: ["受付", "検査"], canWash: false,
  },
  {
    id: "hattori", name: "服部", type: "medical3", group: "⑤医療事務3",
    fulltime: true, skills: ["受付", "検査"], canWash: false,
  },
  // ⑥ 医療事務4
  {
    id: "kasai", name: "笠井", type: "medical4", group: "⑥医療事務4",
    fulltime: false, skills: ["受付"], canWash: false,
    weekShifts: 6,
  },
  // ⑦ 医療事務5
  {
    id: "miyamoto", name: "宮本", type: "medical5", group: "⑦医療事務5",
    fulltime: true, skills: ["診察", "洗浄"], canWash: true,
  },
  // ⑧ 医療事務6
  {
    id: "sugimoto", name: "杉本", type: "medical6", group: "⑧医療事務6",
    fulltime: true, skills: ["受付", "検査", "手術補助"], canWash: false,
  },
];

// ============================================================
// DATE UTILITIES
// ============================================================
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRange(year: number, month: number): string[] {
  const dates: string[] = [];
  const end = new Date(year, month, 15); // 15th of next month
  const cur = new Date(year, month - 1, 16); // 16th of given month
  while (cur <= end) {
    dates.push(toDateStr(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isWorkDay(ds: string): boolean {
  const dow = new Date(ds).getDay();
  return dow !== 0 && !HOLIDAYS.has(ds);
}

function hasPM(ds: string): boolean {
  const dow = new Date(ds).getDay();
  return isWorkDay(ds) && dow !== 6; // Sat = AM only
}

// ISO week key for grouping
function weekKey(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const wn = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${wn}`;
}

// ============================================================
// SCHEDULER — role assignment helpers
// ============================================================
function setRole(sch: Schedule, id: string, ds: string, slot: Slot, role: Role) {
  if (sch[id]?.[ds]?.[slot]) {
    sch[id][ds][slot].role = role;
  }
}

// 医療事務1 を日付・スロットで3人ローテーション
// Day+slotOffset を3で割った余りでシフトし、毎日異なる順序で役割が回るようにする
function med1Rotated(working: StaffDef[], ds: string, slot: Slot): StaffDef[] {
  const base = ["matsunaga", "kinoshita", "ohama"];
  const offset = (new Date(ds).getDate() + (slot === "pm" ? 1 : 0)) % base.length;
  const rotated = [...base.slice(offset), ...base.slice(0, offset)];
  return rotated.flatMap((id) => {
    const s = working.find((x) => x.id === id);
    return s ? [s] : [];
  });
}

function assignRegular(
  sch: Schedule,
  ds: string,
  slot: Slot,
  working: StaffDef[],
  isSat: boolean
) {
  const used = new Set<string>();

  // 役割固定スタッフ
  working.forEach((s) => {
    if (s.type === "nurse")      { setRole(sch, s.id, ds, slot, "ナース"); used.add(s.id); }
    if (s.type === "orthoptist") { setRole(sch, s.id, ds, slot, "検査");   used.add(s.id); }
    if (s.type === "medical5")   { setRole(sch, s.id, ds, slot, "診察");   used.add(s.id); }
    if (s.type === "medical4")   { setRole(sch, s.id, ds, slot, "受付");   used.add(s.id); }
  });

  // ローテーション用フェーズ (0/1/2 を日付・スロットで切り替え)
  const phase = (new Date(ds).getDate() + (slot === "pm" ? 1 : 0)) % 3;

  // シュライバー①のみの日時: 火AM(dow=2,am) / 木PM(dow=4,pm) / 土AM(dow=6,am=isSat)
  const dow = new Date(ds).getDay();
  const oneSchr = (dow === 2 && slot === "am") || (dow === 4 && slot === "pm") || dow === 6;

  // ─── 谷口・渡邉・服部 の役割マップ ───────────────────────
  // phase 0: 谷口=シュライバー①, 服部=受付
  // phase 1: 谷口=受付,           服部=検査
  // phase 2: 谷口=シュライバー①,  服部=受付
  // oneSchr時: phase!=1の谷口シュライバーはシュライバー①のまま（既に①指定）
  const taniguchiRole: Role = phase === 1 ? "受付" : "シュライバー①";
  // 渡邉: 火(2)・木(4)は検査、それ以外は受付
  const watanabeRole:  Role = (dow === 2 || dow === 4) ? "検査" : "受付";
  const hattoriRole:   Role = phase === 1 ? "検査" : "受付";

  // ─── 医療事務1 の役割マップ (rotation位置 [0][1][2] に対応) ──
  // phase 0 (谷口がシュライバー①を1枠担当): m1は シュライバー①+受付+検査
  // phase 1 (谷口が受付に回る):              m1は シュライバー①+シュライバー②(or受付)+受付
  // phase 2 (谷口がシュライバー①を1枠担当): m1は 受付+シュライバー②(or受付)+受付
  // oneSchr=true 時: 谷口が phase0/2 でシュライバー①を担当するため m1[0] は受付に
  const m1RolesByPhase: [Role, Role, Role][] = [
    [oneSchr ? "受付" : "シュライバー①", "受付",                         "検査"],  // phase 0
    ["シュライバー①",                    oneSchr ? "受付" : "シュライバー②", "受付"],  // phase 1
    ["受付",                             oneSchr ? "受付" : "シュライバー②", "受付"],  // phase 2
  ];

  const m1    = med1Rotated(working, ds, slot);
  const taniguchi = working.find((s) => s.id === "taniguchi" && !used.has(s.id));
  const watanabe  = working.find((s) => s.id === "watanabe"  && !used.has(s.id));
  const hattori   = working.find((s) => s.id === "hattori"   && !used.has(s.id));
  const med3rest  = working.filter((s) => s.type === "medical3" && !used.has(s.id));

  if (isSat) {
    // ── 土曜: シュライバー①=1, 受付=3 ───────────────────────
    // シュライバー: フェーズに応じて谷口 or m1 先頭
    const schCand =
      (phase !== 1 && taniguchi) ? taniguchi
      : m1.find((s) => !used.has(s.id) && s.skills.includes("シュライバー①"))
      ?? taniguchi ?? undefined;
    if (schCand) { setRole(sch, schCand.id, ds, slot, "シュライバー①"); used.add(schCand.id); }

    // 受付: 3人
    [...m1, ...(taniguchi ? [taniguchi] : []), ...med3rest]
      .filter((s) => !used.has(s.id) && s.skills.includes("受付"))
      .slice(0, 3)
      .forEach((s) => { setRole(sch, s.id, ds, slot, "受付"); used.add(s.id); });
  } else {
    // ── 平日: 3フェーズのローテーション ─────────────────────
    const m1Roles = m1RolesByPhase[phase];

    // 医療事務1 を rotation順で割り当て
    m1.forEach((s, i) => {
      if (!s || used.has(s.id)) return;
      setRole(sch, s.id, ds, slot, m1Roles[i] ?? "受付");
      used.add(s.id);
    });

    // 谷口
    if (taniguchi) { setRole(sch, taniguchi.id, ds, slot, taniguchiRole); used.add(taniguchi.id); }

    // 渡邉・服部
    if (watanabe) { setRole(sch, watanabe.id, ds, slot, watanabeRole); used.add(watanabe.id); }
    if (hattori)  { setRole(sch, hattori.id,  ds, slot, hattoriRole);  used.add(hattori.id);  }
  }

  // 欠員などで未割当の医療事務 → スキルに応じて検査 or 受付
  working
    .filter((s) => ["medical1", "medical2", "medical3", "medical6"].includes(s.type) && !used.has(s.id))
    .forEach((s) => {
      setRole(sch, s.id, ds, slot, s.skills.includes("検査") ? "検査" : "受付");
      used.add(s.id);
    });

  // シュライバーが不足なら、検査・受付役の医療事務(シュライバー技能持ち)を振り替え
  // oneSchr=true: シュライバー①のみ1人、それ以外: ①1人+②1人=計2人
  // ※振り替え後に受付が減っても、後続の受付補完ロジックが補う
  if (!isSat) {
    const isSchr = (r: string) => r === "シュライバー①" || r === "シュライバー②";
    const schr1Now = working.filter((s) => sch[s.id]?.[ds]?.[slot]?.role === "シュライバー①").length;
    const schr2Now = working.filter((s) => sch[s.id]?.[ds]?.[slot]?.role === "シュライバー②").length;
    const maxSchr = oneSchr ? 1 : 2;
    const schrNow = schr1Now + schr2Now;

    if (schrNow < maxSchr) {
      let filled = 0;
      const shortfall = maxSchr - schrNow;
      // 次に割り当てるシュライバーの種類 (①が0なら①、それ以外は②)
      const nextSchrRole = (): Role => schr1Now + filled === 0 ? "シュライバー①" : "シュライバー②";

      // 検査役から優先的に振り替え
      for (const s of working) {
        if (filled >= shortfall) break;
        if (!["medical1", "medical2"].includes(s.type)) continue;
        if (sch[s.id]?.[ds]?.[slot]?.role === "検査" && s.skills.includes("シュライバー①")) {
          setRole(sch, s.id, ds, slot, nextSchrRole());
          filled++;
        }
      }
      // まだ足りなければ受付役から振り替え
      for (const s of working) {
        if (filled >= shortfall) break;
        if (!["medical1", "medical2"].includes(s.type)) continue;
        if (sch[s.id]?.[ds]?.[slot]?.role === "受付" && s.skills.includes("シュライバー①") && !isSchr(sch[s.id]?.[ds]?.[slot]?.role ?? "")) {
          setRole(sch, s.id, ds, slot, nextSchrRole());
          filled++;
        }
      }
    }
  }

  // 受付・検査のバランス補完（ガードなしで最大5パス）
  if (!isSat) {
    const isMedFlex = (s: StaffDef) =>
      ["medical1", "medical2", "medical3", "medical6"].includes(s.type);
    const roleNow   = (id: string) => sch[id]?.[ds]?.[slot]?.role ?? "";
    const recCount  = () => working.filter((s) => roleNow(s.id) === "受付").length;
    const kenCount  = () => working.filter(
      (s) => s.type === "orthoptist" || roleNow(s.id) === "検査"
    ).length;

    for (let pass = 0; pass < 5; pass++) {
      const rec = recCount();
      const ken = kenCount();
      if (rec >= 3 && ken >= 3) break;

      if (rec < 3 && ken > 3) {
        // 検査超過 → 検査の医療事務を受付に振り替え
        const cand = working.find(
          (s) => isMedFlex(s) && roleNow(s.id) === "検査" && s.skills.includes("受付")
        );
        if (cand) setRole(sch, cand.id, ds, slot, "受付");
        else break;
      } else if (ken < 3 && rec > 3) {
        // 検査不足 → 受付超過分を検査に振り替え
        const cand = working.find(
          (s) => isMedFlex(s) && roleNow(s.id) === "受付" && s.skills.includes("検査")
        );
        if (cand) setRole(sch, cand.id, ds, slot, "検査");
        else break;
      } else {
        break; // 両方不足 or 既に条件達成 → これ以上調整不可
      }
    }
  }
}

function assignSurgery(sch: Schedule, ds: string, slot: Slot, working: StaffDef[], minRec: number) {
  const used = new Set<string>();
  const isTuePM = new Date(ds).getDay() === 2;

  // ① ナース: 村田=手術固定、平野=ナース
  working.forEach((s) => {
    if (s.type === "nurse") {
      const role: Role = s.id === "murata" ? "手術" : "ナース";
      setRole(sch, s.id, ds, slot, role);
      if (s.id === "murata") sch[s.id][ds][slot].fixed = true;
      used.add(s.id);
    }
  });

  // ② 宮本: 火午後=洗浄固定、それ以外=診察
  const miya = working.find((x) => x.id === "miyamoto" && !used.has(x.id));
  if (miya) {
    const miyaRole: Role = isTuePM ? "洗浄" : "診察";
    setRole(sch, "miyamoto", ds, slot, miyaRole);
    if (isTuePM) sch["miyamoto"][ds][slot].fixed = true;
    used.add("miyamoto");
  }

  // ③ 洗浄: 火午後=3人（宮本込み）、木午後=2人
  const washTarget = isTuePM ? 3 : 2;
  let washGot = isTuePM && miya ? 1 : 0; // 宮本が洗浄済みなら1人カウント
  const washOrder = ["hasegawa", "nishibata", "kinoshita", "ohama"];
  for (const id of washOrder) {
    if (washGot >= washTarget) break;
    const s = working.find((x) => x.id === id && !used.has(x.id));
    if (s) { setRole(sch, s.id, ds, slot, "洗浄"); used.add(s.id); washGot++; }
  }

  // ④ 手術補助: 2人 — 松永・木下・大濱・谷口・杉本 を日付でローテーション
  const surgBase = ["matsunaga", "kinoshita", "ohama", "taniguchi", "sugimoto"];
  const surgOffset = new Date(ds).getDate() % surgBase.length;
  let surgGot = 0;
  for (let i = 0; i < surgBase.length && surgGot < 2; i++) {
    const id = surgBase[(surgOffset + i) % surgBase.length];
    const s = working.find((x) => x.id === id && !used.has(x.id));
    if (s) { setRole(sch, s.id, ds, slot, "手術補助"); used.add(s.id); surgGot++; }
  }

  // ⑤ シュライバー①: 木午後のみ1人 (火午後は0人でよい)
  if (!isTuePM) {
    const schOrder = ["taniguchi", "matsunaga", "kinoshita", "ohama"];
    for (const id of schOrder) {
      const s = working.find((x) => x.id === id && !used.has(x.id));
      if (s) { setRole(sch, s.id, ds, slot, "シュライバー①"); used.add(s.id); break; }
    }
  }

  // ⑥ 受付: minRec人以上 (火午後=2, 木午後=3)
  const recOrder = ["watanabe", "hattori", "kasai", "sugimoto", "taniguchi", "matsunaga", "kinoshita", "ohama"];
  let recGot = 0;
  for (const id of recOrder) {
    if (recGot >= minRec) break;
    const s = working.find((x) => x.id === id && !used.has(x.id));
    if (s) { setRole(sch, s.id, ds, slot, "受付"); used.add(s.id); recGot++; }
  }

  // 残り視能訓練士 → 検査
  working.forEach((s) => {
    if (!used.has(s.id) && s.type === "orthoptist") {
      setRole(sch, s.id, ds, slot, "検査");
      used.add(s.id);
    }
  });

  // 残り全員 → 受付 fallback
  working.forEach((s) => {
    if (!used.has(s.id)) {
      setRole(sch, s.id, ds, slot, "受付");
    }
  });
}

// ============================================================
// 常勤スタッフ週1枠の休み付与
// ============================================================
function assignWeeklyOff(sch: Schedule, dates: string[]) {
  const fulltimeStaff = STAFF.filter((s) => s.fulltime);

  // 週ごとの稼働スロットを収集
  const weekMap = new Map<string, Array<{ ds: string; slot: Slot }>>();
  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const wk = weekKey(new Date(ds));
    if (!weekMap.has(wk)) weekMap.set(wk, []);
    weekMap.get(wk)!.push({ ds, slot: "am" });
    if (hasPM(ds)) weekMap.get(wk)!.push({ ds, slot: "pm" });
  });

  // 平野の固定スケジュール（村田の休み候補を絞るために使用）
  const hiranoFixed = STAFF.find((s) => s.id === "hirano")!.fixed!;

  let weekIdx = 0;
  weekMap.forEach((slots) => {
    fulltimeStaff.forEach((s, staffIdx) => {
      let candidates = slots;

      if (s.id === "murata") {
        // 村田: 平野が出勤 かつ 火・木午後でない枠のみ休み可
        // 火・木午後は手術固定のため休み不可
        candidates = slots.filter(({ ds, slot }) => {
          const dow = new Date(ds).getDay();
          if ((dow === 2 || dow === 4) && slot === "pm") return false;
          return (hiranoFixed[dow] ?? []).includes(slot);
        });
      }

      if (candidates.length === 0) return;

      // (staffIdx + weekIdx) % 候補数 で決定論的に1枠を選択
      // staffIdx をそのまま使うことで、同じ週に複数スタッフが同一スロットに集中しない
      // ※ staffIdx * 3 は candidates.length=3 のとき常に0になるためNG
      const idx = (staffIdx + weekIdx) % candidates.length;
      const { ds, slot } = candidates[idx];
      sch[s.id][ds][slot] = { working: false, role: "休" };
    });
    weekIdx++;
  });
}

// ============================================================
// MAIN GENERATOR
// ============================================================
function generate(year: number, month: number): Schedule {
  const sch: Schedule = {};
  STAFF.forEach((s) => { sch[s.id] = {}; });
  const dates = getRange(year, month);

  // Step 1: 勤務可否を設定
  dates.forEach((ds) => {
    const d = new Date(ds);
    const dow = d.getDay();
    const work = isWorkDay(ds);
    const pm = hasPM(ds);

    STAFF.forEach((s) => {
      let amW = false, pmW = false;
      let amF = false, pmF = false;

      if (work) {
        if (s.fixed) {
          const slots = s.fixed[dow] ?? [];
          amW = slots.includes("am");
          pmW = pm && slots.includes("pm");
          amF = amW;
          pmF = pmW;
        } else if (s.fulltime) {
          amW = true;
          pmW = pm;
        }
        // weekShifts (笠井) は後で処理
      }

      sch[s.id][ds] = {
        am: { working: amW, role: "", fixed: amF },
        pm: { working: pmW, role: "", fixed: pmF },
      };
    });
  });

  // Step 2: 笠井の週6枠を割り当て (午前優先)
  const weekSlots: Record<string, Array<{ ds: string; slot: Slot }>> = {};
  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const d = new Date(ds);
    const dow = d.getDay();
    const wk = weekKey(d);
    if (!weekSlots[wk]) weekSlots[wk] = [];
    weekSlots[wk].push({ ds, slot: "am" });
    if (dow !== 6) weekSlots[wk].push({ ds, slot: "pm" });
  });

  Object.values(weekSlots).forEach((slots) => {
    // 笠井: 火曜日午後は固定休みなので除外
    const kasaiSlots = slots.filter(({ ds, slot }) => !(new Date(ds).getDay() === 2 && slot === "pm"));
    const ams = kasaiSlots.filter((x) => x.slot === "am");
    const pms = kasaiSlots.filter((x) => x.slot === "pm");
    let count = 0;
    [...ams, ...pms].forEach(({ ds, slot }) => {
      if (count >= 6) return;
      sch["kasai"][ds][slot].working = true;
      count++;
    });
  });

  // Step 2.5: 常勤スタッフに週1枠の休みを付与
  assignWeeklyOff(sch, dates);

  // Step 3: 役割を割り当て
  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const d = new Date(ds);
    const dow = d.getDay();
    const isSat = dow === 6;

    const getWorking = (slot: Slot) =>
      STAFF.filter((s) => sch[s.id]?.[ds]?.[slot]?.working);

    // 午前 (全営業日)
    const isSurgeryAM = false; // 午前は手術なし
    assignRegular(sch, ds, "am", getWorking("am"), isSat);

    // 午後 (土曜以外)
    if (!isSat) {
      const isSurgeryPM = dow === 2 || dow === 4; // 火(2)・木(4)
      if (isSurgeryPM) {
        // 火午後: 受付最低2人 / 木午後: 受付最低3人
        assignSurgery(sch, ds, "pm", getWorking("pm"), dow === 4 ? 3 : 2);
      } else {
        assignRegular(sch, ds, "pm", getWorking("pm"), false);
      }
    }
    void isSurgeryAM; // suppress unused warning
  });

  // Step 4: 固定役割の上書き（ロールアサイン後に適用）
  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const dow = new Date(ds).getDay();

    // 杉本: 火・木午前は受付固定
    if ((dow === 2 || dow === 4) && sch["sugimoto"]?.[ds]?.am?.working) {
      setRole(sch, "sugimoto", ds, "am", "受付");
      sch["sugimoto"][ds]["am"].fixed = true;
    }

    // 駒田: 火曜日午後はレンズ固定
    if (dow === 2 && sch["komada"]?.[ds]?.pm?.working) {
      setRole(sch, "komada", ds, "pm", "レンズ");
      sch["komada"][ds]["pm"].fixed = true;
    }
  });

  // Step 5: 各スロットの受付1人を受付・レジにローテーション
  const rejiOrder = ["watanabe", "hattori", "kasai", "taniguchi", "matsunaga", "kinoshita", "ohama", "sugimoto"];
  let rejiIdx = 0;
  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const dow = new Date(ds).getDay();
    const slots: Slot[] = dow === 6 ? ["am"] : ["am", "pm"];
    slots.forEach((slot) => {
      const recWorkers = STAFF.filter(
        (s) => sch[s.id]?.[ds]?.[slot]?.working && sch[s.id]?.[ds]?.[slot]?.role === "受付"
      );
      if (recWorkers.length === 0) return;
      // rejiOrder を rejiIdx 位置から順に探し、受付中のスタッフを1人選ぶ
      for (let i = 0; i < rejiOrder.length; i++) {
        const id = rejiOrder[(rejiIdx + i) % rejiOrder.length];
        const found = recWorkers.find((s) => s.id === id);
        if (found) {
          setRole(sch, found.id, ds, slot, "受付・レジ");
          rejiIdx++;
          break;
        }
      }
    });
  });

  return sch;
}

// ============================================================
// VALIDATION
// ============================================================
interface Warning {
  ds: string;
  slot: Slot;
  msg: string;
}

function validate(sch: Schedule, dates: string[]): Warning[] {
  const warns: Warning[] = [];

  dates.forEach((ds) => {
    if (!isWorkDay(ds)) return;
    const d = new Date(ds);
    const dow = d.getDay();
    const slots: Slot[] = dow === 6 ? ["am"] : ["am", "pm"];

    slots.forEach((slot) => {
      const working = STAFF.filter((s) => sch[s.id]?.[ds]?.[slot]?.working);
      const roleOf = (id: string) => sch[id]?.[ds]?.[slot]?.role ?? "";
      const isTuePM  = dow === 2 && slot === "pm";
      const isThuPM  = dow === 4 && slot === "pm";
      const isSurgery = isTuePM || isThuPM;

      // ナース最低1人
      const nurses = working.filter((s) => s.type === "nurse");
      if (nurses.length === 0) warns.push({ ds, slot, msg: "ナース0人（最低1人必要）" });

      if (isSurgery) {
        // 手術午後ルール: 火午後=洗浄3人、木午後=洗浄2人
        const wash = working.filter((s) => roleOf(s.id) === "洗浄");
        const washMin = isTuePM ? 3 : 2;
        if (wash.length < washMin) warns.push({ ds, slot, msg: `洗浄係${wash.length}人（${washMin}人必要）` });

        const surg = working.filter((s) => roleOf(s.id) === "手術補助");
        if (surg.length < 2) warns.push({ ds, slot, msg: `手術補助${surg.length}人（2人必要）` });

        // 火午後はシュライバー0人でOK、木午後はシュライバー①1人以上必要
        const schr1 = working.filter((s) => roleOf(s.id) === "シュライバー①");
        if (!isTuePM && schr1.length < 1) warns.push({ ds, slot, msg: "シュライバー①0人（1人必要）" });

        const rec = working.filter((s) => roleOf(s.id) === "受付" || roleOf(s.id) === "受付・レジ");
        // 火午後=2人、木午後=3人
        const recMin = isThuPM ? 3 : 2;
        if (rec.length < recMin) warns.push({ ds, slot, msg: `受付${rec.length}人（${recMin}人必要）` });
        if (isTuePM && rec.length > 2) warns.push({ ds, slot, msg: `受付${rec.length}人（2人固定）` });
      } else {
        // 通常ルール: 月〜土AM / 月水木金PM → 受付3人以上
        const orthos = working.filter((s) => s.type === "orthoptist");
        if (orthos.length === 0) warns.push({ ds, slot, msg: "視能訓練士0人（最低1人必要）" });

        const kensakei = working.filter(
          (s) => s.type === "orthoptist" || roleOf(s.id) === "検査"
        );
        if (kensakei.length < 3) warns.push({ ds, slot, msg: `視能+検査${kensakei.length}人（3〜5人必要）` });

        const rec = working.filter((s) => roleOf(s.id) === "受付" || roleOf(s.id) === "受付・レジ");
        if (rec.length < 3) warns.push({ ds, slot, msg: `受付${rec.length}人（3人以上必要）` });

        // oneSchr日時(火AM/木PM/土AM)はシュライバー①1人、それ以外は①+②合計2人
        const schrDow = new Date(ds).getDay();
        const isOneSchrSlot = (schrDow === 2 && slot === "am") || (schrDow === 4 && slot === "pm") || schrDow === 6;
        const schrMin = isOneSchrSlot ? 1 : 2;
        const schr1v = working.filter((s) => roleOf(s.id) === "シュライバー①");
        const schr2v = working.filter((s) => roleOf(s.id) === "シュライバー②");
        const schrTotal = schr1v.length + schr2v.length;
        // シュライバー①は必ず1人以上
        if (schr1v.length < 1) warns.push({ ds, slot, msg: `シュライバー①0人（1人必要）` });
        if (!isOneSchrSlot && schrTotal < 2) warns.push({ ds, slot, msg: `シュライバー①+②合計${schrTotal}人（2人必要）` });
      }
    });
  });

  return warns;
}

// ============================================================
// UI COMPONENT
// ============================================================
type ColDef = {
  ds: string;
};

// localStorage キー
function storageKey(y: number, m: number) { return `shift-${y}-${m}`; }

function saveToStorage(y: number, m: number, s: Schedule) {
  try { localStorage.setItem(storageKey(y, m), JSON.stringify(s)); } catch {}
}
function loadFromStorage(y: number, m: number): Schedule | null {
  try {
    const raw = localStorage.getItem(storageKey(y, m));
    return raw ? (JSON.parse(raw) as Schedule) : null;
  } catch { return null; }
}

export default function ShiftPage() {
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(5);
  const [sch, setSch]     = useState<Schedule>(() => loadFromStorage(2026, 5) ?? generate(2026, 5));
  const [modal, setModal] = useState<{ staffId: string; ds: string; slot: Slot } | null>(null);
  const [showWarns, setShowWarns] = useState(false);
  const [savedMonths, setSavedMonths] = useState<Set<string>>(() => {
    // 保存済みキー一覧を初期化
    const keys = new Set<string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("shift-")) keys.add(k);
      }
    } catch {}
    return keys;
  });

  const dates = useMemo(() => getRange(year, month), [year, month]);
  const warns  = useMemo(() => validate(sch, dates), [sch, dates]);

  // 列定義: 日付1つにつき1列（AM/PMは縦積みで表示）
  const cols = useMemo<ColDef[]>(() => dates.map((ds) => ({ ds })), [dates]);

  // グループ別スタッフ
  const groups = useMemo(() => {
    const map = new Map<string, StaffDef[]>();
    STAFF.forEach((s) => {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    });
    return Array.from(map.entries());
  }, []);

  // 年月切替: 保存済みがあれば読込、なければ新規生成
  function handleYearChange(y: number) {
    setYear(y);
    setSch(loadFromStorage(y, month) ?? generate(y, month));
    setShowWarns(false);
  }
  function handleMonthChange(m: number) {
    setMonth(m);
    setSch(loadFromStorage(year, m) ?? generate(year, m));
    setShowWarns(false);
  }

  function handleGenerate() {
    setSch(generate(year, month));
    setShowWarns(false);
  }

  function handleSave() {
    saveToStorage(year, month, sch);
    setSavedMonths((prev) => new Set(prev).add(storageKey(year, month)));
    alert(`${year}年${month}月のシフトを保存しました。`);
  }

  const isSaved = savedMonths.has(storageKey(year, month));

  function applyRole(role: Role) {
    if (!modal) return;
    const { staffId, ds, slot } = modal;
    setSch((prev) => {
      const n: Schedule = JSON.parse(JSON.stringify(prev));
      if (role === "休" || role === "有休") {
        n[staffId][ds][slot] = { working: false, role, fixed: false };
      } else {
        n[staffId][ds][slot] = { working: true, role, fixed: false };
      }
      return n;
    });
    setModal(null);
  }

  const modalStaff = modal ? STAFF.find((s) => s.id === modal.staffId) ?? null : null;
  const modalCell  = modal
    ? sch[modal.staffId]?.[modal.ds]?.[modal.slot] ?? null
    : null;

  // 期間表示文字列
  const periodLabel = (() => {
    const endM = month === 12 ? 1 : month + 1;
    const endY = month === 12 ? year + 1 : year;
    return `${year}年${month}月16日 〜 ${endY}年${endM}月15日`;
  })();

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* ── ヘッダー ── */}
      <header className="flex-shrink-0 bg-slate-800 text-white px-4 py-2 flex items-center gap-2 flex-wrap print:hidden">
        <h1 className="text-sm font-bold mr-1">🏥 クリニックシフト表</h1>

        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="bg-white text-slate-800 text-sm px-1.5 py-0.5 rounded"
        >
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          className="bg-white text-slate-800 text-sm px-1.5 py-0.5 rounded"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          className="bg-blue-500 hover:bg-blue-400 active:bg-blue-600 px-3 py-1 rounded text-sm font-bold"
        >
          シフト生成
        </button>

        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-500 active:bg-green-700 px-3 py-1 rounded text-sm font-bold"
        >
          保存
        </button>

        <span className="text-slate-400 text-xs hidden sm:inline">
          {periodLabel}{isSaved ? " 💾" : ""}
        </span>

        <button
          onClick={() => setShowWarns((v) => !v)}
          className={`px-3 py-1 rounded text-sm ml-1 ${
            warns.length > 0 ? "bg-red-500 hover:bg-red-400" : "bg-slate-600 hover:bg-slate-500"
          }`}
        >
          ルール確認 {warns.length > 0 ? `⚠ ${warns.length}件` : "✓"}
        </button>

        <button
          onClick={() => window.print()}
          className="ml-auto bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded text-sm"
        >
          印刷
        </button>
      </header>

      {/* ── 警告パネル ── */}
      {showWarns && warns.length > 0 && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-2 max-h-32 overflow-y-auto print:hidden">
          <p className="text-red-700 font-bold text-xs mb-1">⚠ ルール違反 {warns.length}件</p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {warns.map((w, i) => {
              const d = new Date(w.ds);
              return (
                <li key={i}>
                  {d.getMonth() + 1}/{d.getDate()}({DOW_JP[d.getDay()]})&nbsp;
                  {w.slot === "am" ? "午前" : "午後"}: {w.msg}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── 凡例 ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-white border-b flex-wrap print:hidden">
        <span className="text-slate-500 text-xs">凡例:</span>
        {Object.entries(ROLE_CLS)
          .filter(([k]) => k !== "")
          .map(([role, cls]) => (
            <span key={role} className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>
              {role}
            </span>
          ))}
        <span className="text-slate-400 text-xs ml-2">P=パート　●=固定シフト</span>
      </div>

      {/* ── テーブル ── */}
      <div className="flex-1 overflow-auto print:overflow-visible print:flex-none print:w-auto">
        <table className="border-collapse text-xs" style={{ minWidth: "max-content" }}>
          <thead className="sticky top-0 z-20">
            <tr>
              <th colSpan={2} className="sticky left-0 z-30 bg-slate-700 text-white border border-slate-600 px-3 py-1 text-left whitespace-nowrap">
                氏名
              </th>
              {cols.map(({ ds }) => {
                const d   = new Date(ds);
                const dow = d.getDay();
                const hol = HOLIDAYS.has(ds);
                const work = isWorkDay(ds);
                const bg  =
                  !work || hol || dow === 0 ? "bg-red-700"
                  : dow === 6               ? "bg-blue-700"
                                            : "bg-slate-700";
                return (
                  <th
                    key={ds}
                    className={`${bg} text-white border border-slate-600 text-center px-1 py-1 whitespace-nowrap`}
                  >
                    <div className="text-xs">{d.getMonth() + 1}/{d.getDate()}</div>
                    <div className="text-xs opacity-75">({DOW_JP[dow]}){hol ? "祝" : ""}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.flatMap(([groupLabel, staffList]) => [
              // グループヘッダー行
              <tr key={`g-${groupLabel}`}>
                <td
                  colSpan={cols.length + 2}
                  className="bg-slate-200 text-slate-700 font-bold text-xs px-3 py-0.5 border border-slate-300 sticky left-0 z-10"
                >
                  {groupLabel}
                </td>
              </tr>,
              // スタッフ行: 午前・午後で2行ずつ
              ...staffList.flatMap((staff: StaffDef) => {
                const renderCell = (ds: string, slot: Slot, ci: number) => {
                  const dow = new Date(ds).getDay();
                  const hol = HOLIDAYS.has(ds);
                  const work = isWorkDay(ds);
                  if (!work) {
                    return <td key={ci} className={`border border-slate-200 ${hol || dow === 0 ? "bg-red-50" : "bg-slate-100"}`} />;
                  }
                  if (slot === "pm" && dow === 6) {
                    return <td key={ci} className="border border-slate-200 bg-slate-50" />;
                  }
                  const cell = sch[staff.id]?.[ds]?.[slot];
                  if (!cell) return <td key={ci} className="border border-slate-200 bg-slate-50" />;
                  const cls = cell.working
                    ? ROLE_CLS[cell.role] ?? "bg-white text-slate-600"
                    : "bg-gray-100 text-gray-400";
                  return (
                    <td
                      key={ci}
                      onClick={() => setModal({ staffId: staff.id, ds, slot })}
                      className={`${cls} border border-slate-200 text-center cursor-pointer select-none px-1 py-0.5 relative min-w-[48px] font-bold`}
                      title={`${staff.name} ${ds} ${slot === "am" ? "午前" : "午後"}`}
                    >
                      {cell.working ? (ROLE_SHORT[cell.role] ?? cell.role) || "○" : cell.role || "休"}
                      {cell.fixed && cell.working && (
                        <span className="absolute top-0 right-0 text-amber-500 leading-none" style={{ fontSize: "7px" }}>●</span>
                      )}
                    </td>
                  );
                };

                return [
                  // 午前行
                  <tr key={`${staff.id}-am`} className="hover:bg-blue-50 staff-divider">
                    <td rowSpan={2} className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-0.5 font-medium whitespace-nowrap align-middle min-w-[72px]">
                      {staff.name}
                      {!staff.fulltime && <span className="ml-1 text-slate-400 text-xs">P</span>}
                    </td>
                    <td className="sticky left-[73px] z-10 bg-slate-50 border border-slate-200 px-1 text-center text-xs font-semibold text-slate-600 whitespace-nowrap select-none">
                      午前
                    </td>
                    {cols.map(({ ds }, ci) => renderCell(ds, "am", ci))}
                  </tr>,
                  // 午後行
                  <tr key={`${staff.id}-pm`} className="hover:bg-blue-50">
                    <td className="sticky left-[73px] z-10 bg-slate-100 border border-slate-200 px-1 text-center text-xs font-semibold text-slate-500 whitespace-nowrap select-none">
                      午後
                    </td>
                    {cols.map(({ ds }, ci) => renderCell(ds, "pm", ci))}
                  </tr>,
                ];
              }),
            ])}
          </tbody>
        </table>
      </div>

      {/* ── 編集モーダル ── */}
      {modal && modalStaff && modalCell && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-4 w-56"
            onClick={(e) => e.stopPropagation()}
          >
            {/* タイトル */}
            <div className="font-bold text-sm mb-0.5">{modalStaff.name}</div>
            <div className="text-xs text-slate-500 mb-3">
              {(() => {
                const d = new Date(modal.ds);
                return `${d.getMonth() + 1}/${d.getDate()}(${DOW_JP[d.getDay()]}) ${
                  modal.slot === "am" ? "午前" : "午後"
                }`;
              })()}
              {modalCell.fixed && (
                <span className="ml-2 text-amber-600">● 固定シフト</span>
              )}
            </div>

            {/* 役割ボタン */}
            <div className="space-y-1.5">
              {(modalStaff.skills as Role[]).flatMap((role): Role[] =>
                role === "受付" ? ["受付", "受付・レジ"] : [role]
              ).map((role) => (
                <button
                  key={role}
                  onClick={() => applyRole(role)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-opacity ${
                    ROLE_CLS[role] ?? "bg-slate-100"
                  } ${
                    modalCell.role === role && modalCell.working
                      ? "ring-2 ring-slate-500 font-bold"
                      : ""
                  }`}
                >
                  {role}
                  {modalCell.role === role && modalCell.working ? " ✓" : ""}
                </button>
              ))}

              {/* 有休 */}
              <button
                onClick={() => applyRole("有休")}
                className={`w-full text-left px-3 py-2 rounded text-sm ${ROLE_CLS["有休"]} ${
                  !modalCell.working && modalCell.role === "有休" ? "ring-2 ring-slate-500 font-bold" : ""
                }`}
              >
                有休{!modalCell.working && modalCell.role === "有休" ? " ✓" : ""}
              </button>

              {/* 休み */}
              <button
                onClick={() => applyRole("休")}
                className={`w-full text-left px-3 py-2 rounded text-sm ${ROLE_CLS["休"]} ${
                  !modalCell.working && modalCell.role !== "有休" ? "ring-2 ring-slate-500 font-bold" : ""
                }`}
              >
                休（不在）{!modalCell.working && modalCell.role !== "有休" ? " ✓" : ""}
              </button>
            </div>

            <button
              onClick={() => setModal(null)}
              className="mt-3 w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
