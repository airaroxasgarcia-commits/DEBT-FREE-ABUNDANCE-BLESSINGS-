import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Zap, Droplet, Flame, Wifi, Phone, Tv, Car, ShieldCheck, Landmark,
  ShoppingCart, CreditCard, GraduationCap, Wallet, Plus, X, Check, Trash2,
  TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight,
  Sparkles, Utensils, HeartPulse, Popcorn, MoreHorizontal, ChevronRight,
  LayoutGrid, Receipt, Landmark as Bank
} from "lucide-react";

/* ---------------- constants ---------------- */

const BILL_ICONS = {
  rent: { icon: Home, label: "Rent / Mortgage" },
  electricity: { icon: Zap, label: "Electricity" },
  water: { icon: Droplet, label: "Water" },
  gas: { icon: Flame, label: "Gas" },
  internet: { icon: Wifi, label: "Internet" },
  phone: { icon: Phone, label: "Phone" },
  streaming: { icon: Tv, label: "Streaming" },
  car: { icon: Car, label: "Car" },
  insurance: { icon: ShieldCheck, label: "Insurance" },
  other: { icon: MoreHorizontal, label: "Other" },
};

const DEBT_ICONS = {
  creditcard: { icon: CreditCard, label: "Credit Card" },
  bankloan: { icon: Bank, label: "Bank Loan" },
  auto: { icon: Car, label: "Auto Loan" },
  student: { icon: GraduationCap, label: "Student Loan" },
  mortgage: { icon: Home, label: "Mortgage" },
  personal: { icon: Wallet, label: "Personal Loan" },
};

const TXN_CATS = {
  income: { icon: TrendingUp, label: "Income", color: "var(--green)" },
  food: { icon: Utensils, label: "Food", color: "var(--gold)" },
  transport: { icon: Car, label: "Transport", color: "var(--gold)" },
  shopping: { icon: ShoppingCart, label: "Shopping", color: "var(--gold)" },
  bills: { icon: Receipt, label: "Bills", color: "var(--violet-accent)" },
  fun: { icon: Popcorn, label: "Fun", color: "var(--violet-accent)" },
  health: { icon: HeartPulse, label: "Health", color: "var(--red)" },
  other: { icon: MoreHorizontal, label: "Other", color: "var(--text-dim)" },
};

const STORAGE_KEY = "finance-tracker-data-v1";

const fmt = (n) =>
  (n < 0 ? "-₱" : "₱") +
  Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth()}`;
const uid = () => Math.random().toString(36).slice(2, 10);

const seedData = () => ({
  transactions: [
    { id: uid(), type: "income", category: "income", amount: 2800, note: "Paycheck", date: todayISO() },
    { id: uid(), type: "expense", category: "food", amount: 42.5, note: "Groceries", date: todayISO() },
    { id: uid(), type: "expense", category: "transport", amount: 18, note: "Gas top-up", date: todayISO() },
  ],
  bills: [
    { id: uid(), name: "Apartment Rent", category: "rent", amount: 1200, dueDay: 1, lastPaidMonth: null },
    { id: uid(), name: "Electric Co.", category: "electricity", amount: 85, dueDay: 12, lastPaidMonth: null },
    { id: uid(), name: "City Water", category: "water", amount: 40, dueDay: 15, lastPaidMonth: null },
    { id: uid(), name: "Fiber Internet", category: "internet", amount: 60, dueDay: 20, lastPaidMonth: null },
  ],
  debts: [
    { id: uid(), name: "Visa Card", category: "creditcard", balance: 1850, original: 3000, rate: 22.9, minPayment: 75 },
    { id: uid(), name: "Auto Loan", category: "auto", balance: 9400, original: 15000, rate: 6.5, minPayment: 320 },
  ],
});

/* ---------------- storage hook ----------------
   Uses the browser's localStorage, so data lives on this device/browser
   only. No account, no server — private by default. */

function usePersistedData() {
  const [data, setData] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedData();
    } catch (e) {
      return seedData();
    }
  });
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage full or unavailable — fail silently */ }
  }, [data]);

  return [data, setData, true];
}

/* ---------------- small UI pieces ---------------- */

function Ring({ pct, size = 92, stroke = 9, label, sub, gradId }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#${gradId})`} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-pct">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

function IconBadge({ Icon, tone = "gold" }) {
  return (
    <div className={`icon-badge tone-${tone}`}>
      <Icon size={18} strokeWidth={2.1} />
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/* ---------------- main app ---------------- */

export default function FinanceTracker() {
  const [data, setData, loaded] = usePersistedData();
  const [tab, setTab] = useState("dashboard");
  const [sheet, setSheet] = useState(null); // 'txn' | 'bill' | 'debt' | {payDebtId}
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  if (!loaded || !data) {
    return (
      <div className="app loading-screen">
        <style>{CSS}</style>
        <Sparkles className="spin" size={28} />
        <p>Loading your finances…</p>
      </div>
    );
  }

  const { transactions, bills, debts } = data;

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const debtTotals = useMemo(() => {
    const balance = debts.reduce((s, d) => s + d.balance, 0);
    const original = debts.reduce((s, d) => s + (d.original || d.balance), 0);
    const paidPct = original > 0 ? ((original - balance) / original) * 100 : 0;
    return { balance, original, paidPct };
  }, [debts]);

  const savingsRate = totals.income > 0 ? Math.max(0, ((totals.income - totals.expense) / totals.income) * 100) : 0;

  const curMonth = monthKey();
  const billsDue = bills.filter(b => b.lastPaidMonth !== curMonth);
  const billsPaid = bills.filter(b => b.lastPaidMonth === curMonth);

  /* ---- actions ---- */

  const addTxn = (t) => setData(d => ({ ...d, transactions: [{ id: uid(), ...t }, ...d.transactions] }));
  const delTxn = (id) => setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));

  const addBill = (b) => setData(d => ({ ...d, bills: [{ id: uid(), lastPaidMonth: null, ...b }, ...d.bills] }));
  const delBill = (id) => setData(d => ({ ...d, bills: d.bills.filter(b => b.id !== id) }));
  const toggleBillPaid = (id) => setData(d => ({
    ...d,
    bills: d.bills.map(b => b.id === id ? { ...b, lastPaidMonth: b.lastPaidMonth === curMonth ? null : curMonth } : b)
  }));

  const addDebt = (deb) => setData(d => ({ ...d, debts: [{ id: uid(), ...deb, original: deb.original || deb.balance }, ...d.debts] }));
  const delDebt = (id) => setData(d => ({ ...d, debts: d.debts.filter(x => x.id !== id) }));
  const payDebt = (id, amount) => setData(d => ({
    ...d,
    debts: d.debts.map(x => x.id === id ? { ...x, balance: Math.max(0, x.balance - amount) } : x)
  }));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* header */}
      <div className="header">
        <div className="header-top">
          <div>
            <p className="eyebrow">{greeting}</p>
            <h1>Your money, today</h1>
          </div>
          <div className="crown-badge"><PiggyBank size={20} /></div>
        </div>

        <div className="hero-card">
          <div className="hero-left">
            <span className="hero-label">Balance this period</span>
            <span className={`hero-amount ${totals.balance < 0 ? "neg" : ""}`}>{fmt(totals.balance)}</span>
            <div className="hero-row">
              <span className="pill pill-green"><ArrowUpRight size={13} /> {fmt(totals.income)}</span>
              <span className="pill pill-red"><ArrowDownRight size={13} /> {fmt(totals.expense)}</span>
            </div>
          </div>
          <Ring pct={savingsRate} gradId="ringHero" label="Saved" />
        </div>
      </div>

      {/* content */}
      <div className="content">
        {tab === "dashboard" && (
          <DashboardTab
            transactions={transactions}
            totals={totals}
            billsDue={billsDue}
            debtTotals={debtTotals}
            onDelTxn={delTxn}
          />
        )}
        {tab === "bills" && (
          <BillsTab
            billsDue={billsDue}
            billsPaid={billsPaid}
            onToggle={toggleBillPaid}
            onDelete={delBill}
          />
        )}
        {tab === "debts" && (
          <DebtsTab
            debts={debts}
            debtTotals={debtTotals}
            onDelete={delDebt}
            onPay={(id) => setSheet({ kind: "pay", id })}
          />
        )}
        {tab === "learn" && <LearnTab />}
      </div>

      {/* bottom nav */}
      <div className="tabbar">
        <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} Icon={LayoutGrid} label="Today" />
        <TabBtn active={tab === "bills"} onClick={() => setTab("bills")} Icon={Receipt} label="Bills" />
        <button
          className="fab"
          onClick={() => setSheet({ kind: tab === "bills" ? "bill" : tab === "debts" ? "debt" : "txn" })}
          aria-label="Add"
        >
          <Plus size={24} strokeWidth={2.4} />
        </button>
        <TabBtn active={tab === "debts"} onClick={() => setTab("debts")} Icon={Bank} label="Debts" />
        <TabBtn active={tab === "learn"} onClick={() => setTab("learn")} Icon={Sparkles} label="Learn" />
      </div>

      {/* sheets */}
      {sheet && sheet.kind === "txn" && (
        <TxnSheet onClose={() => setSheet(null)} onSave={(t) => { addTxn(t); setSheet(null); flash("Added"); }} />
      )}
      {sheet && sheet.kind === "bill" && (
        <BillSheet onClose={() => setSheet(null)} onSave={(b) => { addBill(b); setSheet(null); flash("Bill added"); }} />
      )}
      {sheet && sheet.kind === "debt" && (
        <DebtSheet onClose={() => setSheet(null)} onSave={(d) => { addDebt(d); setSheet(null); flash("Debt added"); }} />
      )}
      {sheet && sheet.kind === "pay" && (
        <PaySheet
          debt={debts.find(x => x.id === sheet.id)}
          onClose={() => setSheet(null)}
          onSave={(amt) => { payDebt(sheet.id, amt); setSheet(null); flash("Payment logged"); }}
        />
      )}

      {toast && <div className="toast"><Check size={14} /> {toast}</div>}
    </div>
  );
}

/* ---------------- tabs ---------------- */

function DashboardTab({ transactions, billsDue, debtTotals, onDelTxn }) {
  return (
    <>
      {billsDue.length > 0 && (
        <div className="alert-strip">
          <Receipt size={15} />
          <span>{billsDue.length} bill{billsDue.length > 1 ? "s" : ""} still due this month</span>
        </div>
      )}

      <SectionHead title="Recent activity" />
      {transactions.length === 0 && <EmptyState text="No transactions yet. Tap + to log your first one." />}
      <div className="list">
        {transactions.slice(0, 30).map(t => {
          const meta = TXN_CATS[t.category] || TXN_CATS.other;
          const Icon = meta.icon;
          return (
            <div className="row" key={t.id}>
              <IconBadge Icon={Icon} tone={t.type === "income" ? "green" : "violet"} />
              <div className="row-mid">
                <span className="row-title">{t.note || meta.label}</span>
                <span className="row-sub">{meta.label} · {t.date}</span>
              </div>
              <span className={`row-amt ${t.type === "income" ? "pos" : "neg"}`}>
                {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
              </span>
              <button className="row-del" onClick={() => onDelTxn(t.id)}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>

      <SectionHead title="Debt snapshot" />
      <div className="mini-card">
        <div className="mini-card-top">
          <span>Total owed</span>
          <strong>{fmt(debtTotals.balance)}</strong>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${debtTotals.paidPct}%` }} /></div>
        <span className="mini-caption">{Math.round(debtTotals.paidPct)}% paid off overall</span>
      </div>
    </>
  );
}

function BillsTab({ billsDue, billsPaid, onToggle, onDelete }) {
  return (
    <>
      <SectionHead title={`Due (${billsDue.length})`} />
      {billsDue.length === 0 && <EmptyState text="Nothing due — you're all caught up." />}
      <div className="list">
        {billsDue.sort((a, b) => a.dueDay - b.dueDay).map(b => {
          const meta = BILL_ICONS[b.category] || BILL_ICONS.other;
          const Icon = meta.icon;
          return (
            <div className="row" key={b.id}>
              <IconBadge Icon={Icon} tone="gold" />
              <div className="row-mid">
                <span className="row-title">{b.name}</span>
                <span className="row-sub">Due day {b.dueDay} · {meta.label}</span>
              </div>
              <span className="row-amt">{fmt(b.amount)}</span>
              <button className="pay-btn" onClick={() => onToggle(b.id)}>Mark paid</button>
              <button className="row-del" onClick={() => onDelete(b.id)}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>

      {billsPaid.length > 0 && (
        <>
          <SectionHead title={`Paid this month (${billsPaid.length})`} />
          <div className="list">
            {billsPaid.map(b => {
              const meta = BILL_ICONS[b.category] || BILL_ICONS.other;
              const Icon = meta.icon;
              return (
                <div className="row row-done" key={b.id}>
                  <IconBadge Icon={Icon} tone="green" />
                  <div className="row-mid">
                    <span className="row-title">{b.name}</span>
                    <span className="row-sub">Paid ✓</span>
                  </div>
                  <span className="row-amt">{fmt(b.amount)}</span>
                  <button className="pay-btn ghost" onClick={() => onToggle(b.id)}>Undo</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function DebtsTab({ debts, debtTotals, onDelete, onPay }) {
  return (
    <>
      <div className="mini-card center-card">
        <Ring pct={debtTotals.paidPct} size={104} stroke={10} gradId="ringDebt" />
        <div>
          <span className="mini-caption">Balance remaining</span>
          <strong className="big-num">{fmt(debtTotals.balance)}</strong>
        </div>
      </div>

      <SectionHead title="Loans & debts" />
      {debts.length === 0 && <EmptyState text="No debts tracked. Tap + to add a loan or card." />}
      <div className="list">
        {debts.map(d => {
          const meta = DEBT_ICONS[d.category] || DEBT_ICONS.personal;
          const Icon = meta.icon;
          const pct = d.original > 0 ? ((d.original - d.balance) / d.original) * 100 : 0;
          return (
            <div className="debt-card" key={d.id}>
              <div className="debt-card-top">
                <IconBadge Icon={Icon} tone="violet" />
                <div className="row-mid">
                  <span className="row-title">{d.name}</span>
                  <span className="row-sub">{meta.label} · {d.rate}% APR · min {fmt(d.minPayment)}/mo</span>
                </div>
                <button className="row-del" onClick={() => onDelete(d.id)}><Trash2 size={14} /></button>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <div className="debt-card-bottom">
                <span className="row-amt neg">{fmt(d.balance)} left</span>
                <button className="pay-btn" onClick={() => onPay(d.id)}>Log payment</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LearnTab() {
  const steps = [
    { t: "Track every dollar", d: "Freedom starts with visibility — log income and spending daily so nothing is a mystery." },
    { t: "Build a small cushion first", d: "Save ₱500–₱1,000 before attacking debt aggressively, so surprises don't push you back into borrowing." },
    { t: "Kill high-interest debt fast", d: "List debts by interest rate. Pay minimums on all, throw extra at the highest rate (avalanche) — or smallest balance first if you need quick wins (snowball)." },
    { t: "Automate the boring parts", d: "Auto-pay bills and auto-transfer savings the day you're paid, so good habits don't rely on willpower." },
    { t: "Grow your gap", d: "The space between what you earn and spend is what buys freedom — widen it by raising income, trimming costs, or both." },
    { t: "Invest the surplus", d: "Once debt is under control, put savings to work — retirement accounts and index funds are the quiet engine of long-term freedom." },
  ];
  return (
    <>
      <SectionHead title="Path to financial freedom" />
      <div className="learn-list">
        {steps.map((s, i) => (
          <div className="learn-card" key={i}>
            <span className="learn-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mini-card">
        <span className="mini-caption">Rule of thumb</span>
        <strong className="big-num" style={{ fontSize: 22 }}>50 / 30 / 20</strong>
        <p className="learn-foot">50% needs, 30% wants, 20% savings &amp; debt payoff — use it as a starting split, then adjust to your goals.</p>
      </div>
    </>
  );
}

/* ---------------- sheets (forms) ---------------- */

function TxnSheet({ onClose, onSave }) {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const cats = Object.entries(TXN_CATS).filter(([k]) => type === "income" ? k === "income" : k !== "income");
