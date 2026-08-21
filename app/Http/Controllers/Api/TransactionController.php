<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TransactionRequest;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Display a listing of the user's transactions.
     * Eager-loads wallet and category to prevent N+1.
     */
    public function index(Request $request): JsonResponse
    {
        $transactions = $request->user()
            ->transactions()
            ->with(['wallet:id,name,type', 'category:id,name,type'])
            ->orderBy('transaction_date', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Store a newly created transaction.
     *
     * Business Logic:
     * - If the category type is 'income', the wallet balance is INCREASED.
     * - If the category type is 'expense', the wallet balance is DECREASED.
     * - Wrapped in a DB transaction for atomicity.
     */
    public function store(TransactionRequest $request): JsonResponse
    {
        // Verify wallet and category belong to the authenticated user
        $wallet = Wallet::where('id', $request->wallet_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $wallet) {
            return response()->json(['message' => 'Wallet not found.'], 404);
        }

        $category = Category::where('id', $request->category_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }

        $transaction = DB::transaction(function () use ($request, $wallet, $category) {
            // Create the transaction record
            $transaction = $request->user()->transactions()->create([
                'wallet_id'        => $wallet->id,
                'category_id'      => $category->id,
                'amount'           => $request->amount,
                'transaction_date' => $request->transaction_date,
                'notes'            => $request->notes,
                'tags'             => $request->tags,
            ]);

            // Update wallet balance based on category type
            if ($category->type === 'income') {
                $wallet->increment('balance', $request->amount);
            } else {
                $wallet->decrement('balance', $request->amount);
            }

            return $transaction;
        });

        $transaction->load(['wallet:id,name,type,balance', 'category:id,name,type']);

        return response()->json([
            'message'     => 'Transaction created successfully.',
            'transaction' => $transaction,
        ], 201);
    }

    /**
     * Display the specified transaction.
     */
    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $transaction->load(['wallet:id,name,type,balance', 'category:id,name,type']);

        return response()->json([
            'transaction' => $transaction,
        ]);
    }

    /**
     * Update the specified transaction.
     *
     * Business Logic:
     * 1. Reverse the old transaction's effect on the old wallet.
     * 2. Apply the new transaction's effect on the new wallet.
     * This handles cases where the wallet or category changes.
     */
    public function update(TransactionRequest $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        // Verify new wallet and category belong to the authenticated user
        $newWallet = Wallet::where('id', $request->wallet_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $newWallet) {
            return response()->json(['message' => 'Wallet not found.'], 404);
        }

        $newCategory = Category::where('id', $request->category_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $newCategory) {
            return response()->json(['message' => 'Category not found.'], 404);
        }

        $updatedTransaction = DB::transaction(function () use ($request, $transaction, $newWallet, $newCategory) {
            // Step 1: Reverse the OLD transaction's effect on the OLD wallet
            $oldWallet   = Wallet::find($transaction->wallet_id);
            $oldCategory = Category::find($transaction->category_id);

            if ($oldCategory->type === 'income') {
                $oldWallet->decrement('balance', $transaction->amount);
            } else {
                $oldWallet->increment('balance', $transaction->amount);
            }

            // Step 2: Update the transaction record
            $transaction->update([
                'wallet_id'        => $newWallet->id,
                'category_id'      => $newCategory->id,
                'amount'           => $request->amount,
                'transaction_date' => $request->transaction_date,
                'notes'            => $request->notes,
                'tags'             => $request->tags,
            ]);

            // Step 3: Apply the NEW transaction's effect on the NEW wallet
            if ($newCategory->type === 'income') {
                $newWallet->increment('balance', $request->amount);
            } else {
                $newWallet->decrement('balance', $request->amount);
            }

            return $transaction;
        });

        $updatedTransaction->load(['wallet:id,name,type,balance', 'category:id,name,type']);

        return response()->json([
            'message'     => 'Transaction updated successfully.',
            'transaction' => $updatedTransaction,
        ]);
    }

    /**
     * Remove the specified transaction.
     * Reverses the transaction's effect on the wallet balance.
     */
    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        DB::transaction(function () use ($transaction) {
            $wallet   = Wallet::find($transaction->wallet_id);
            $category = Category::find($transaction->category_id);

            // Reverse the transaction's effect
            if ($category->type === 'income') {
                $wallet->decrement('balance', $transaction->amount);
            } else {
                $wallet->increment('balance', $transaction->amount);
            }

            $transaction->delete();
        });

        return response()->json([
            'message' => 'Transaction deleted successfully.',
        ]);
    }
}
