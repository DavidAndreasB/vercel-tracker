<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary for the authenticated user.
     *
     * Returns:
     * - total_net_worth: Sum of all wallet balances
     * - current_month_income: Total income transactions this month
     * - current_month_expense: Total expense transactions this month
     * - category_breakdown: Income/Expense totals grouped by category
     * - wallets: All wallets with their balances
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $now  = now();

        // Total net worth: sum of all wallet balances
        $totalNetWorth = $user->wallets()->sum('balance');

        // Current month income & expense from transactions
        $monthlySummary = $user->transactions()
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->whereYear('transactions.transaction_date', $now->year)
            ->whereMonth('transactions.transaction_date', $now->month)
            ->select(
                'categories.type',
                DB::raw('SUM(transactions.amount) as total')
            )
            ->groupBy('categories.type')
            ->pluck('total', 'type');

        $currentMonthIncome  = $monthlySummary->get('income', 0);
        $currentMonthExpense = $monthlySummary->get('expense', 0);

        // Category breakdown for current month
        $categoryBreakdown = $user->transactions()
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->whereYear('transactions.transaction_date', $now->year)
            ->whereMonth('transactions.transaction_date', $now->month)
            ->select(
                'categories.id',
                'categories.name',
                'categories.type',
                DB::raw('SUM(transactions.amount) as total'),
                DB::raw('COUNT(transactions.id) as transaction_count')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.type')
            ->orderByDesc('total')
            ->get();

        // All wallets with balances
        $wallets = $user->wallets()
            ->select('id', 'name', 'type', 'balance')
            ->orderBy('name')
            ->get();

        return response()->json([
            'total_net_worth'       => $totalNetWorth,
            'current_month_income'  => $currentMonthIncome,
            'current_month_expense' => $currentMonthExpense,
            'category_breakdown'    => $categoryBreakdown,
            'wallets'               => $wallets,
        ]);
    }
}
