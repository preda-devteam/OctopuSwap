
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
        
        bag::add(&mut coins, into_string(get<ETH>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<DAI>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<USDC>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<BNB>()),balance::create_supply(ETH{}));

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
        
        bag::add(&mut coins, into_string(get<ETH>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<DAI>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<USDC>()),balance::create_supply(ETH{}));
        bag::add(&mut coins, into_string(get<BNB>()),balance::create_supply(ETH{}));

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
}