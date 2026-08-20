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
  (n < 0 ? "-$" : "$") +
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
    { t: "Build a small cushion first", d: "Save $500–$1,000 before attacking debt aggressively, so surprises don't push you back into borrowing." },
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

  return (
    <Sheet title="Log a transaction" onClose={onClose}>
      <div className="seg">
        <button className={type === "expense" ? "on" : ""} onClick={() => { setType("expense"); setCategory("food"); }}>Expense</button>
        <button className={type === "income" ? "on" : ""} onClick={() => { setType("income"); setCategory("income"); }}>Income</button>
      </div>
      <Field label="Amount">
        <input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </Field>
      <Field label="Category">
        <div className="chip-grid">
          {cats.map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} className={`chip ${category === k ? "on" : ""}`} onClick={() => setCategory(k)}>
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Note (optional)">
        <input placeholder="What was it for?" value={note} onChange={e => setNote(e.target.value)} />
      </Field>
      <button
        className="save-btn"
        disabled={!amount || Number(amount) <= 0}
        onClick={() => onSave({ type, category, amount: Number(amount), note, date: todayISO() })}
      >
        Save transaction
      </button>
    </Sheet>
  );
}

function BillSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("electricity");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");

  return (
    <Sheet title="Add a bill" onClose={onClose}>
      <Field label="Bill name">
        <input placeholder="e.g. Electric Co." value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <div className="chip-grid">
          {Object.entries(BILL_ICONS).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} className={`chip ${category === k ? "on" : ""}`} onClick={() => setCategory(k)}>
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="two-col">
        <Field label="Amount">
          <input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Due day">
          <input inputMode="numeric" placeholder="1-31" value={dueDay} onChange={e => setDueDay(e.target.value)} />
        </Field>
      </div>
      <button
        className="save-btn"
        disabled={!name || !amount}
        onClick={() => onSave({ name, category, amount: Number(amount), dueDay: Number(dueDay) || 1 })}
      >
        Save bill
      </button>
    </Sheet>
  );
}

function DebtSheet({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("creditcard");
  const [balance, setBalance] = useState("");
  const [original, setOriginal] = useState("");
  const [rate, setRate] = useState("");
  const [minPayment, setMinPayment] = useState("");

  return (
    <Sheet title="Add a loan or debt" onClose={onClose}>
      <Field label="Name">
        <input placeholder="e.g. Visa Card" value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="Type">
        <div className="chip-grid">
          {Object.entries(DEBT_ICONS).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} className={`chip ${category === k ? "on" : ""}`} onClick={() => setCategory(k)}>
                <Icon size={14} /> {v.label}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="two-col">
        <Field label="Current balance">
          <input inputMode="decimal" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} />
        </Field>
        <Field label="Original amount">
          <input inputMode="decimal" placeholder="optional" value={original} onChange={e => setOriginal(e.target.value)} />
        </Field>
      </div>
      <div className="two-col">
        <Field label="Interest rate %">
          <input inputMode="decimal" placeholder="0.0" value={rate} onChange={e => setRate(e.target.value)} />
        </Field>
        <Field label="Min payment / mo">
          <input inputMode="decimal" placeholder="0.00" value={minPayment} onChange={e => setMinPayment(e.target.value)} />
        </Field>
      </div>
      <button
        className="save-btn"
        disabled={!name || !balance}
        onClick={() => onSave({
          name, category,
          balance: Number(balance),
          original: Number(original) || Number(balance),
          rate: Number(rate) || 0,
          minPayment: Number(minPayment) || 0,
        })}
      >
        Save debt
      </button>
    </Sheet>
  );
}

function PaySheet({ debt, onClose, onSave }) {
  const [amount, setAmount] = useState(debt ? String(debt.minPayment || "") : "");
  if (!debt) return null;
  return (
    <Sheet title={`Pay ${debt.name}`} onClose={onClose}>
      <p className="pay-context">Current balance: <strong>{fmt(debt.balance)}</strong></p>
      <Field label="Payment amount">
        <input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </Field>
      <button
        className="save-btn"
        disabled={!amount || Number(amount) <= 0}
        onClick={() => onSave(Number(amount))}
      >
        Log payment
      </button>
    </Sheet>
  );
}

/* ---------------- misc ---------------- */

function TabBtn({ active, onClick, Icon, label }) {
  return (
    <button className={`tab-btn ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
      <span>{label}</span>
    </button>
  );
}

function SectionHead({ title }) {
  return <div className="section-head"><h2>{title}</h2></div>;
}

function EmptyState({ text }) {
  return <div className="empty"><Sparkles size={20} /><p>{text}</p></div>;
}

/* ---------------- styles ---------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap');

:root{
  --bg:#150c28;
  --bg-2:#1c1236;
  --surface:#241a3f;
  --surface-2:#2d2150;
  --gold:#e8b93e;
  --gold-soft:#f6d879;
  --green:#2fae6a;
  --green-soft:#7fe3ac;
  --violet-accent:#9b7ee8;
  --red:#e2596b;
  --text:#f4efff;
  --text-dim:#b3a4d9;
  --border:rgba(232,185,62,0.16);
}
*{box-sizing:border-box;}
.app{
  font-family:'Manrope',sans-serif;
  background:radial-gradient(circle at 10% 0%, #241844 0%, var(--bg) 55%);
  color:var(--text);
  width:100%;
  max-width:480px;
  margin:0 auto;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  position:relative;
  padding-bottom:86px;
}
.loading-screen{align-items:center;justify-content:center;gap:10px;color:var(--text-dim);}
.spin{animation:spin 1.4s linear infinite;color:var(--gold);}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.header{padding:22px 18px 16px;}
.header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
.eyebrow{margin:0;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim);}
h1{font-family:'Fraunces',serif;font-weight:600;font-size:22px;margin:2px 0 0;}
.crown-badge{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--green));display:flex;align-items:center;justify-content:center;color:#1a1130;}

.hero-card{
  background:linear-gradient(155deg,var(--surface-2) 0%, var(--surface) 100%);
  border:1px solid var(--border);
  border-radius:22px;
  padding:18px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  box-shadow:0 12px 30px -14px rgba(0,0,0,.6);
}
.hero-left{display:flex;flex-direction:column;gap:6px;}
.hero-label{font-size:12px;color:var(--text-dim);}
.hero-amount{font-family:'Fraunces',serif;font-size:30px;font-weight:600;color:var(--gold-soft);}
.hero-amount.neg{color:var(--red);}
.hero-row{display:flex;gap:8px;margin-top:4px;}
.pill{display:inline-flex;align-items:center;gap:3px;font-size:11.5px;padding:4px 8px;border-radius:20px;font-weight:600;}
.pill-green{background:rgba(47,174,106,0.16);color:var(--green-soft);}
.pill-red{background:rgba(226,89,107,0.16);color:var(--red);}

.ring-wrap{position:relative;flex-shrink:0;}
.ring-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.ring-pct{font-size:15px;font-weight:800;color:var(--text);}

.content{flex:1;padding:4px 18px 12px;overflow-y:auto;}

.alert-strip{
  display:flex;align-items:center;gap:8px;
  background:rgba(232,185,62,0.12);
  border:1px solid var(--border);
  color:var(--gold-soft);
  padding:10px 14px;border-radius:14px;font-size:13px;font-weight:600;margin-bottom:14px;
}

.section-head{display:flex;align-items:center;margin:18px 0 10px;}
.section-head h2{font-family:'Fraunces',serif;font-size:15.5px;font-weight:600;margin:0;color:var(--text);letter-spacing:.01em;}

.list{display:flex;flex-direction:column;gap:8px;}
.row{
  display:flex;align-items:center;gap:10px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  padding:10px 10px 10px 10px;
}
.row-done{opacity:.6;}
.row-mid{display:flex;flex-direction:column;flex:1;min-width:0;}
.row-title{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.row-sub{font-size:11.5px;color:var(--text-dim);}
.row-amt{font-size:13.5px;font-weight:800;white-space:nowrap;}
.row-amt.pos{color:var(--green-soft);}
.row-amt.neg{color:var(--red);}
.row-del{background:none;border:none;color:var(--text-dim);padding:4px;cursor:pointer;flex-shrink:0;}
.row-del:hover{color:var(--red);}

.icon-badge{
  width:36px;height:36px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.tone-gold{background:rgba(232,185,62,0.16);color:var(--gold-soft);}
.tone-green{background:rgba(47,174,106,0.16);color:var(--green-soft);}
.tone-violet{background:rgba(155,126,232,0.18);color:var(--violet-accent);}

.pay-btn{
  background:var(--gold);color:#231705;border:none;border-radius:20px;
  font-size:11.5px;font-weight:800;padding:7px 11px;cursor:pointer;flex-shrink:0;white-space:nowrap;
}
.pay-btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text-dim);}

.mini-card{
  background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px;
  display:flex;flex-direction:column;gap:8px;
}
.mini-card-top{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:var(--text-dim);}
.mini-card-top strong{font-size:17px;color:var(--text);}
.mini-caption{font-size:11.5px;color:var(--text-dim);}
.big-num{font-family:'Fraunces',serif;font-size:26px;font-weight:600;color:var(--gold-soft);}

.center-card{flex-direction:row;align-items:center;gap:16px;}

.bar-track{height:7px;border-radius:6px;background:rgba(255,255,255,0.08);overflow:hidden;}
.bar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--green));border-radius:6px;}

.debt-card{
  background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:14px;
  display:flex;flex-direction:column;gap:10px;
}
.debt-card-top{display:flex;align-items:center;gap:10px;}
.debt-card-bottom{display:flex;justify-content:space-between;align-items:center;}

.learn-list{display:flex;flex-direction:column;gap:10px;}
.learn-card{
  display:flex;gap:12px;background:var(--surface);border:1px solid var(--border);
  border-radius:16px;padding:14px;
}
.learn-num{font-family:'Fraunces',serif;font-size:20px;font-weight:600;color:var(--gold);flex-shrink:0;}
.learn-card h4{margin:0 0 4px;font-size:13.5px;}
.learn-card p{margin:0;font-size:12.5px;color:var(--text-dim);line-height:1.45;}
.learn-foot{font-size:12px;color:var(--text-dim);margin:4px 0 0;line-height:1.4;}

.empty{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text-dim);padding:30px 10px;text-align:center;font-size:13px;}
.empty svg{color:var(--gold);}

.tabbar{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:100%;max-width:480px;
  background:rgba(28,18,54,0.92);backdrop-filter:blur(14px);
  border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-around;
  padding:8px 6px calc(8px + env(safe-area-inset-bottom));
}
.tab-btn{
  background:none;border:none;color:var(--text-dim);display:flex;flex-direction:column;
  align-items:center;gap:3px;font-size:10.5px;font-weight:700;padding:4px 8px;cursor:pointer;
}
.tab-btn.active{color:var(--gold-soft);}
.fab{
  width:52px;height:52px;border-radius:50%;border:none;flex-shrink:0;
  background:linear-gradient(135deg,var(--gold),var(--green));
  color:#1a1130;display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 20px -6px rgba(232,185,62,0.55);
  margin-top:-24px;cursor:pointer;
}

.sheet-overlay{
  position:fixed;inset:0;background:rgba(9,5,20,0.6);backdrop-filter:blur(2px);
  display:flex;align-items:flex-end;justify-content:center;z-index:50;
}
.sheet{
  width:100%;max-width:480px;background:var(--bg-2);border-radius:22px 22px 0 0;
  border:1px solid var(--border);border-bottom:none;
  padding:10px 18px 22px;max-height:86vh;overflow-y:auto;
}
.sheet-handle{width:36px;height:4px;background:var(--border);border-radius:4px;margin:2px auto 10px;}
.sheet-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.sheet-head h3{font-family:'Fraunces',serif;font-size:17px;margin:0;}
.icon-btn{background:var(--surface);border:none;color:var(--text-dim);width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;}

.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:12.5px;color:var(--text-dim);font-weight:600;}
.field input{
  background:var(--surface);border:1px solid var(--border);border-radius:12px;
  padding:11px 12px;color:var(--text);font-size:14px;font-family:'Manrope',sans-serif;outline:none;
}
.field input:focus{border-color:var(--gold);}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

.seg{display:flex;background:var(--surface);border-radius:12px;padding:4px;margin-bottom:14px;border:1px solid var(--border);}
.seg button{flex:1;background:none;border:none;color:var(--text-dim);padding:9px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;}
.seg button.on{background:linear-gradient(135deg,var(--gold),var(--green));color:#1a1130;}

.chip-grid{display:flex;flex-wrap:wrap;gap:8px;}
.chip{
  display:flex;align-items:center;gap:5px;background:var(--surface);border:1px solid var(--border);
  color:var(--text-dim);padding:7px 11px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;
}
.chip.on{background:rgba(232,185,62,0.18);border-color:var(--gold);color:var(--gold-soft);}

.save-btn{
  width:100%;background:linear-gradient(135deg,var(--gold),var(--green));border:none;color:#1a1130;
  font-weight:800;font-size:14.5px;padding:14px;border-radius:14px;cursor:pointer;margin-top:4px;
}
.save-btn:disabled{opacity:.4;cursor:not-allowed;}

.pay-context{font-size:13px;color:var(--text-dim);margin:0 0 12px;}

.toast{
  position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
  background:var(--surface-2);border:1px solid var(--gold);color:var(--gold-soft);
  padding:9px 16px;border-radius:20px;font-size:12.5px;font-weight:700;
  display:flex;align-items:center;gap:6px;z-index:60;
}

@media(max-width:360px){
  .hero-amount{font-size:26px;}
}
`;
