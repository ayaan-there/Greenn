module Greenn::green_points {
    use std::signer;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::table;
    // use aptos_framework::event; // not needed when calling 0x1::event::emit fully-qualified

    struct GreenPoints has drop {}

    struct Admin has key {
        mint_cap: coin::MintCapability<GreenPoints>,
        burn_cap: coin::BurnCapability<GreenPoints>,
        merchants: table::Table<address, bool>,
    }

    #[event]
    struct AwardedEvent has drop, store { to: address, amount: u64 }

    #[event]
    struct RedeemedEvent has drop, store { user: address, merchant: address, amount: u64 }

    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_MERCHANT: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;

    fun assert_admin(addr: address) {
        if (!exists<Admin>(addr)) { abort E_NOT_ADMIN }
    }

    fun is_merchant(admin_addr: address, who: address): bool acquires Admin {
        let a = borrow_global<Admin>(admin_addr);
        table::contains(&a.merchants, who)
    }

    /// One-time setup by the deploying admin.
    public entry fun init(
        admin: &signer,
        name: string::String,
        symbol: string::String,
        decimals: u8
    ) {
        // ORDER: (burn, freeze, mint)
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<GreenPoints>(
            admin, name, symbol, decimals, /* monitor_supply */ false
        );

        // We don't use freezing, so destroy the capability explicitly
        coin::destroy_freeze_cap<GreenPoints>(freeze_cap); // <-- fix for “no drop”  [oai_citation:2‡aptos.dev](https://aptos.dev/en/build/smart-contracts/move-reference?branch=mainnet&page=aptos-framework%2Fdoc%2Fcoin.md&utm_source=chatgpt.com)

        move_to(
            admin,
            Admin {
                mint_cap,
                burn_cap,
                merchants: table::new<address, bool>(),
            }
        );
    }

    public entry fun register(user: &signer) {
        coin::register<GreenPoints>(user)
    }

    public entry fun set_merchant(
        admin: &signer,
        merchant_addr: address,
        approved: bool
    ) acquires Admin {
        let admin_addr = signer::address_of(admin);
        assert_admin(admin_addr);

        let a = borrow_global_mut<Admin>(admin_addr);
        if (approved) {
            // Use upsert pattern: remove if exists, then add
            if (table::contains(&a.merchants, merchant_addr)) {
                table::remove(&mut a.merchants, merchant_addr);
            };
            table::add(&mut a.merchants, merchant_addr, true);
        } else {
            // Remove if exists (disapprove merchant)
            if (table::contains(&a.merchants, merchant_addr)) {
                table::remove(&mut a.merchants, merchant_addr);
            };
        }
    }

    public entry fun award(
        admin: &signer,
        to_addr: address,
        amount: u64
    ) acquires Admin {
        let admin_addr = signer::address_of(admin);
        assert_admin(admin_addr);
        assert!(amount > 0, 3); // E_INVALID_AMOUNT
        let a = borrow_global<Admin>(admin_addr);

        let coins = coin::mint<GreenPoints>(amount, &a.mint_cap);
        coin::deposit<GreenPoints>(to_addr, coins);

        0x1::event::emit(AwardedEvent { to: to_addr, amount });
    }

    public entry fun redeem_from(
        merchant: &signer,
        admin_addr: address,
        user_addr: address,
        amount: u64
    ) acquires Admin {
        let merchant_addr = signer::address_of(merchant);
        if (!is_merchant(admin_addr, merchant_addr) && merchant_addr != admin_addr) {
            abort E_NOT_MERCHANT
        };
        assert!(amount > 0, E_INVALID_AMOUNT);
        let a = borrow_global<Admin>(admin_addr);
        coin::burn_from<GreenPoints>(user_addr, amount, &a.burn_cap);

        0x1::event::emit(RedeemedEvent { user: user_addr, merchant: merchant_addr, amount });
    }

    public entry fun redeem_self(
        caller: &signer,
        admin_addr: address,
        amount: u64
    ) acquires Admin {
        let caller_addr = signer::address_of(caller);
        if (!is_merchant(admin_addr, caller_addr) && caller_addr != admin_addr) {
            abort E_NOT_MERCHANT
        };
        assert!(amount > 0, E_INVALID_AMOUNT);
        let a = borrow_global<Admin>(admin_addr);
        coin::burn_from<GreenPoints>(caller_addr, amount, &a.burn_cap);

        0x1::event::emit(RedeemedEvent { user: caller_addr, merchant: caller_addr, amount });
    }
}