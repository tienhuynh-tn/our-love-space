import { Card, SectionLabel } from "@/components/ui/card";
import { ExpenseForm, DeleteItem } from "@/features/adventures/forms";
import { getExpenses, getTrip } from "@/lib/adventures/data";
import { requirePair } from "@/lib/auth";
import { expenseSummary } from "@/lib/adventures/expenses";
import { dateLabel } from "@/features/adventures/trip-card";

export default async function Expenses({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [trip,expenses,{ pair }] = await Promise.all([getTrip(tripId),getExpenses(tripId),requirePair()]);
  const name = (id: string) => id === pair.person_one ? pair.name_one : pair.name_two;
  const summaries = expenseSummary(expenses);
  return <div className="space-y-7">
    <div><SectionLabel>What we shared</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight">A simple record of our trip.</h2><p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">Each currency keeps its own total. No conversions, balances, or settling up.</p></div>
    {!expenses.length && <Card className="p-6 text-sm leading-6">No expenses yet. Add the first meal, journey, or little treat.</Card>}
    <div className="grid items-start gap-5 sm:grid-cols-2">{summaries.map(summary => <Card key={summary.currency} className="space-y-5 p-5">
      <div><p className="text-xs font-semibold tracking-wider">{summary.currency}</p><h3 className="mt-1 break-words text-3xl font-semibold tabular-nums">{summary.total}</h3><p className="mt-1 text-xs text-stone-600 dark:text-stone-400">Total recorded in {summary.currency}</p></div>
      <div><h4 className="mb-2 text-sm font-semibold">By category</h4><dl className="space-y-2 text-sm">{summary.categories.map(category => <div key={category.label} className="flex justify-between gap-3"><dt className="capitalize">{category.label}</dt><dd className="tabular-nums">{category.total}</dd></div>)}</dl></div>
      <div><h4 className="mb-2 text-sm font-semibold">Paid by</h4><dl className="space-y-2 text-sm">{summary.payers.map(payer => <div key={payer.id} className="flex justify-between gap-3"><dt>{name(payer.id)}</dt><dd className="tabular-nums">{payer.total}</dd></div>)}</dl></div>
    </Card>)}</div>
    <ol className="space-y-4">{expenses.map(expense => <li key={expense.id}><Card className="space-y-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-words text-lg font-semibold">{expense.description}</h3><p className="mt-1 text-xs leading-5 text-stone-600 dark:text-stone-400">{dateLabel(expense.date)} · {expense.category} · Paid by {name(expense.paid_by)}</p></div><p className="font-semibold tabular-nums">{expense.amount} {expense.currency}</p></div><details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Edit expense</summary><ExpenseForm trip={trip} pair={pair} expense={expense} /></details><details><summary className="min-h-11 cursor-pointer py-3 text-xs text-stone-600 dark:text-stone-400">Remove expense</summary><DeleteItem item={expense} kind="travel_expenses" /></details></Card></li>)}</ol>
    <Card className="p-5 sm:p-7"><h2 className="mb-5 text-xl font-semibold">Something we spent</h2><ExpenseForm trip={trip} pair={pair} /></Card>
  </div>;
}
