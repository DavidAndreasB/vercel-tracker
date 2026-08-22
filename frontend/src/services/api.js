import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════
export const authAPI = {
  register: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return data;
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════
// WALLETS API
// ═══════════════════════════════════════════════════════════
export const walletsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getOne: async (id) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (walletData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('wallets')
      .insert({ ...walletData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id, walletData) => {
    const { data, error } = await supabase
      .from('wallets')
      .update(walletData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════
// CATEGORIES API
// ═══════════════════════════════════════════════════════════
export const categoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('name');
    if (error) throw error;
    return data;
  },

  getOne: async (id) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (categoryData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...categoryData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id, categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    // Check if category has transactions before deleting
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count > 0) {
      throw new Error('Cannot delete category with existing transactions. Please remove or reassign them first.');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS API
// ═══════════════════════════════════════════════════════════
const PER_PAGE = 20;

export const transactionsAPI = {
  getAll: async (page = 1) => {
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    // Get total count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    // Get paginated data with related wallet and category names
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets(id, name, type),
        category:categories(id, name, type)
      `)
      .order('transaction_date', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data,
      current_page: page,
      last_page: Math.ceil((count || 0) / PER_PAGE),
      total: count || 0,
      per_page: PER_PAGE,
    };
  },

  create: async (txnData) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Insert the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: txnData.wallet_id,
        category_id: txnData.category_id,
        amount: txnData.amount,
        transaction_date: txnData.transaction_date,
        notes: txnData.notes || null,
        tags: txnData.tags || null,
      })
      .select(`*, category:categories(type)`)
      .single();
    if (error) throw error;

    // Update wallet balance based on category type
    const isIncome = data.category?.type === 'income';
    const balanceChange = isIncome ? txnData.amount : -txnData.amount;

    // Get current wallet balance
    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', txnData.wallet_id)
      .single();
    if (walletErr) throw walletErr;

    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + balanceChange })
      .eq('id', txnData.wallet_id);
    if (updateErr) throw updateErr;

    return data;
  },

  update: async (id, txnData) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get the old transaction to reverse its effect on wallet balance
    const { data: oldTxn, error: oldErr } = await supabase
      .from('transactions')
      .select(`*, category:categories(type)`)
      .eq('id', id)
      .single();
    if (oldErr) throw oldErr;

    // Reverse old transaction's effect on old wallet
    const oldIsIncome = oldTxn.category?.type === 'income';
    const oldBalanceChange = oldIsIncome ? -oldTxn.amount : oldTxn.amount;

    const { data: oldWallet, error: oldWalletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', oldTxn.wallet_id)
      .single();
    if (oldWalletErr) throw oldWalletErr;

    await supabase
      .from('wallets')
      .update({ balance: oldWallet.balance + oldBalanceChange })
      .eq('id', oldTxn.wallet_id);

    // Update the transaction
    const { data, error } = await supabase
      .from('transactions')
      .update({
        wallet_id: txnData.wallet_id,
        category_id: txnData.category_id,
        amount: txnData.amount,
        transaction_date: txnData.transaction_date,
        notes: txnData.notes || null,
        tags: txnData.tags || null,
      })
      .eq('id', id)
      .select(`*, category:categories(type)`)
      .single();
    if (error) throw error;

    // Apply new transaction's effect on new wallet
    const newIsIncome = data.category?.type === 'income';
    const newBalanceChange = newIsIncome ? txnData.amount : -txnData.amount;

    const { data: newWallet, error: newWalletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', txnData.wallet_id)
      .single();
    if (newWalletErr) throw newWalletErr;

    await supabase
      .from('wallets')
      .update({ balance: newWallet.balance + newBalanceChange })
      .eq('id', txnData.wallet_id);

    return data;
  },

  delete: async (id) => {
    // Get the transaction to reverse its effect on wallet balance
    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select(`*, category:categories(type)`)
      .eq('id', id)
      .single();
    if (txnErr) throw txnErr;

    // Reverse the transaction's effect on wallet
    const isIncome = txn.category?.type === 'income';
    const balanceChange = isIncome ? -txn.amount : txn.amount;

    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', txn.wallet_id)
      .single();
    if (walletErr) throw walletErr;

    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + balanceChange })
      .eq('id', txn.wallet_id);

    // Delete the transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD API
// ═══════════════════════════════════════════════════════════
export const dashboardAPI = {
  get: async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`;

    // Fetch wallets
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id, name, type, balance')
      .order('name');
    if (walletsError) throw walletsError;

    // Total net worth
    const totalNetWorth = (wallets || []).reduce((sum, w) => sum + w.balance, 0);

    // Fetch current month transactions with category info
    const { data: monthlyTransactions, error: txnError } = await supabase
      .from('transactions')
      .select(`
        amount,
        category:categories(id, name, type)
      `)
      .gte('transaction_date', monthStart)
      .lt('transaction_date', monthEnd);
    if (txnError) throw txnError;

    // Calculate monthly income/expense and category breakdown
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    const categoryMap = {};

    (monthlyTransactions || []).forEach((txn) => {
      const cat = txn.category;
      if (!cat) return;

      if (cat.type === 'income') {
        currentMonthIncome += txn.amount;
      } else {
        currentMonthExpense += txn.amount;
      }

      if (!categoryMap[cat.id]) {
        categoryMap[cat.id] = {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          total: 0,
          transaction_count: 0,
        };
      }
      categoryMap[cat.id].total += txn.amount;
      categoryMap[cat.id].transaction_count += 1;
    });

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    return {
      total_net_worth: totalNetWorth,
      current_month_income: currentMonthIncome,
      current_month_expense: currentMonthExpense,
      category_breakdown: categoryBreakdown,
      wallets,
    };
  },
};
