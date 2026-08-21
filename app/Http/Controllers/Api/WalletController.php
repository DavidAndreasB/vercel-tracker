<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WalletRequest;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    /**
     * Display a listing of the user's wallets.
     */
    public function index(Request $request): JsonResponse
    {
        $wallets = $request->user()
            ->wallets()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'wallets' => $wallets,
        ]);
    }

    /**
     * Store a newly created wallet.
     * If an initial balance is provided, it will be set directly.
     */
    public function store(WalletRequest $request): JsonResponse
    {
        $wallet = $request->user()->wallets()->create([
            'name'    => $request->name,
            'type'    => $request->type,
            'balance' => $request->input('balance', 0),
        ]);

        return response()->json([
            'message' => 'Wallet created successfully.',
            'wallet'  => $wallet,
        ], 201);
    }

    /**
     * Display the specified wallet.
     */
    public function show(Request $request, Wallet $wallet): JsonResponse
    {
        // Ensure the wallet belongs to the authenticated user
        if ($wallet->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'wallet' => $wallet,
        ]);
    }

    /**
     * Update the specified wallet.
     */
    public function update(WalletRequest $request, Wallet $wallet): JsonResponse
    {
        // Ensure the wallet belongs to the authenticated user
        if ($wallet->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $wallet->update($request->only(['name', 'type', 'balance']));

        return response()->json([
            'message' => 'Wallet updated successfully.',
            'wallet'  => $wallet->fresh(),
        ]);
    }

    /**
     * Remove the specified wallet.
     */
    public function destroy(Request $request, Wallet $wallet): JsonResponse
    {
        // Ensure the wallet belongs to the authenticated user
        if ($wallet->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $wallet->delete();

        return response()->json([
            'message' => 'Wallet deleted successfully.',
        ]);
    }
}
