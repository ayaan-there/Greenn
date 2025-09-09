#[test_only]
module Greenn::green_points_test {
    use std::signer;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::AptosCoin;
    use Greenn::green_points;

    #[test(admin = @Greenn, student = @0x123, merchant = @0x456, aptos_framework = @0x1)]
    public fun test_full_flow(admin: &signer, student: &signer, merchant: &signer, aptos_framework: &signer) {
        // Setup accounts and framework
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(student));
        account::create_account_for_test(signer::address_of(merchant));
        
        // Initialize coin infrastructure
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(aptos_framework);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        // Initialize the coin
        green_points::init(
            admin,
            string::utf8(b"Green Points"),
            string::utf8(b"GPNT"),
            8
        );

        // Register users
        green_points::register(student);
        green_points::register(merchant);

        // Set merchant
        green_points::set_merchant(admin, signer::address_of(merchant), true);

        // Award points
        green_points::award(admin, signer::address_of(student), 100);
        
        // Check balance
        let balance = coin::balance<green_points::GreenPoints>(signer::address_of(student));
        assert!(balance == 100, 1);

        // Redeem points
        green_points::redeem_from(
            merchant, 
            signer::address_of(admin), 
            signer::address_of(student), 
            50
        );

        // Check final balance
        let final_balance = coin::balance<green_points::GreenPoints>(signer::address_of(student));
        assert!(final_balance == 50, 2);
    }

    #[test(admin = @Greenn, user = @0x123, aptos_framework = @0x1)]
    #[expected_failure(abort_code = 2, location = Greenn::green_points)]
    public fun test_unauthorized_redeem(admin: &signer, user: &signer, aptos_framework: &signer) {
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(signer::address_of(user));
        
        // Initialize coin infrastructure
        let (burn_cap, mint_cap) = aptos_framework::aptos_coin::initialize_for_test(aptos_framework);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);

        green_points::init(
            admin,
            string::utf8(b"Green Points"),
            string::utf8(b"GPNT"),
            8
        );

        green_points::register(user);
        green_points::award(admin, signer::address_of(user), 100);

        // This should fail - user is not a merchant
        green_points::redeem_from(
            user, 
            signer::address_of(admin), 
            signer::address_of(user), 
            50
        );
    }
}
