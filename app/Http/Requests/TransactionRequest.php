<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'wallet_id'        => ['required', 'integer', 'exists:wallets,id'],
            'category_id'      => ['required', 'integer', 'exists:categories,id'],
            'amount'           => ['required', 'integer', 'min:1'],
            'transaction_date' => ['required', 'date'],
            'notes'            => ['nullable', 'string'],
            'tags'             => ['nullable', 'string', 'max:255'],
        ];
    }
}
