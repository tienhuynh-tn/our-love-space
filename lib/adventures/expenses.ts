import type { Expense } from "@/types/adventures";
import { sumMoney } from "./validation.ts";

export function expenseSummary(expenses: Expense[]) {
  return [...new Set(expenses.map(expense => expense.currency))].sort().map(currency => {
    const group = expenses.filter(expense => expense.currency === currency);
    return {
      currency, total: sumMoney(group.map(expense => expense.amount),currency),
      categories: [...new Set(group.map(expense => expense.category))].sort().map(category => ({ label: category, total: sumMoney(group.filter(expense => expense.category === category).map(expense => expense.amount),currency) })),
      payers: [...new Set(group.map(expense => expense.paid_by))].map(payer => ({ id: payer, total: sumMoney(group.filter(expense => expense.paid_by === payer).map(expense => expense.amount),currency) })),
    };
  });
}
