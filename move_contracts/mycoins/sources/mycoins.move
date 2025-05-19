
module dex::mycoins{
    use sui::bag::{Self, Bag};
    use std::type_name::{into_string, get};
    use sui::balance;
    use sui::coin;
    use std::ascii::String;
    use sui::event;


    public struct XSUI has drop{}

    public struct XBTC has drop{}

    public struct CoinMintEvent has drop,copy{
        owner: address,
        symbol: String,
        amount: u64,
    }

    public struct CoinManager has key{
        id:UID,
        coins:Bag
    }

    /*========= initialize =========*/
    fun init(ctx: &mut TxContext){
        let mut coins = bag::new(ctx);
        
        bag::add(&mut coins, into_string(get<XSUI>()),balance::create_supply(XSUI{}));
        bag::add(&mut coins, into_string(get<XBTC>()),balance::create_supply(XBTC{}));

        transfer::share_object(
            CoinManager{
                id: object::new(ctx),
                coins:coins,
            }
        );
    }

    #[test_only]
    public fun init_test(ctx: &mut TxContext) {
        let mut coins = bag::new(ctx);
        
        bag::add(&mut coins, into_string(get<XSUI>()),balance::create_supply(XSUI{}));
        bag::add(&mut coins, into_string(get<XBTC>()),balance::create_supply(XBTC{}));

        transfer::share_object(
            CoinManager{
                id: object::new(ctx),
                coins:coins,
            }
        );
    }

    public entry fun mint<T>(coin_manager: &mut CoinManager, amount: u64, ctx: &mut TxContext){
        let supply = bag::borrow_mut<String,balance::Supply<T>>(&mut coin_manager.coins, into_string(get<T>()));
        let minted_coin = coin::from_balance(
            balance::increase_supply(
                supply,
                amount,
            ),
            ctx
        );
        event::emit(CoinMintEvent{
            owner: tx_context::sender(ctx),
            symbol: into_string(get<T>()),
            amount: coin::value(&minted_coin)
        });
        transfer::public_transfer(minted_coin,tx_context::sender(ctx));

    }

    public entry fun mint_and_split<T>(coin_manager: &mut CoinManager, amount: u64, split_num:u64, ctx: &mut TxContext){
        let supply = bag::borrow_mut<String,balance::Supply<T>>(&mut coin_manager.coins, into_string(get<T>()));
        let mut minted_coin = coin::from_balance(
            balance::increase_supply(
                supply,
                amount,
            ),
            ctx
        );
        event::emit(CoinMintEvent{
            owner: tx_context::sender(ctx),
            symbol: into_string(get<T>()),
            amount: coin::value(&minted_coin)
        });
        let mut split_coins = coin::divide_into_n(&mut minted_coin, split_num, ctx);
        let split_count = vector::length(&split_coins); 
        let mut i = 0;
        while (i < split_count) {
            let coin = vector::pop_back(&mut split_coins);
            transfer::public_transfer(coin, tx_context::sender(ctx));
            i = i + 1;
        };
        transfer::public_transfer(minted_coin, tx_context::sender(ctx));
        split_coins.destroy_empty();
    }
}