/*
/// Module: amm

*/
module dex::amm{
    use std::u128::sqrt;
    use sui::balance::{Self, Balance, Supply};
    use std::bcs;
    use std::type_name::get;
    use sui::coin::{Self,Coin};
    use sui::event::emit;
    /*========= constants =========*/
    const EQUAL: u8 = 0;
    const SMALLER: u8 = 1;
    const GREATER: u8 = 2;

    const EXCESSIVE_SILIPPAGE:u64 = 500;
    const IS_NOT_ORDER:u64 = 501;
    const LIQUID_NOT_ENOUGH:u64 = 502;

    const MINIMUM_LIQUIDITY: u64 = 1000;

    /// Current fee is 0.3%
    const FEE_MULTIPLIER: u64 = 3;
    const FEE_SCALE: u64 = 1000;
    

    /*========= math =========*/
    public fun muldiv_u128(a: u128, b: u128, c: u128):u64{
        ((a * b / c) as u64)
    }

    public fun muldiv(a: u64, b: u64, c: u64): u64 {
        ((((a as u128) * (b as u128)) / (c as u128)) as u64)
    }

    public fun mulsqrt(a: u64, b: u64): u64 {
        (sqrt((a as u128) * (b as u128)) as u64)
    }

    /*========= events =========*/
    public struct CreateEvent has drop,copy{
        reserve_x: u64,
        reserve_y: u64,
        lp_supply: u64,
    }

    public struct MintEvent has drop,copy{
        amount_x_in: u64,
        amount_y_in:u64,
        lp_out: u64,
        reserve_lp: u64,
        reserve_x: u64,
        reserve_y: u64,
    }

    public struct BurnEvent has drop,copy{
        lp_in: u64,
        amount_x_out: u64,
        amount_y_out:u64,
        reserve_lp: u64,
        reserve_x: u64,
        reserve_y: u64,
    }

    public struct SwapEvent has drop,copy{
        amount_x_in: u64,
        amount_y_in:u64,
        amount_x_out: u64,
        amount_y_out:u64,
        reserve_x: u64,
        reserve_y: u64,
    }

    /*========= structs =========*/
    public struct LP<phantom X, phantom Y> has drop, store {}
    public struct Pool<phantom X, phantom Y> has key,store {
        id: UID,
        coin_x: Balance<X>,
        coin_y: Balance<Y>,
        lp_supply: Supply<LP<X, Y>>,
    }

    /*========= initialize =========*/
    // fun init(ctx: &mut TxContext){

    // }


    /*========= tool functions =========*/
    ///compare func
    public struct Result has drop {
        inner: u8,
    }

    public fun is_equal(result: &Result): bool {
        return result.inner == EQUAL
    }

    public fun is_smaller_than(result: &Result): bool {
        return result.inner == SMALLER
    }

    public fun is_greater_than(result: &Result): bool {
        result.inner == GREATER
    }

    // Performs a comparison of two types after BCS serialization.
    public fun compare<T>(left: &T, right: &T): Result {
        let left_bytes = bcs::to_bytes(left);
        let right_bytes = bcs::to_bytes(right);

        compare_u8_vector(left_bytes, right_bytes)
    }

    // Performs a comparison of two vector<u8>s or byte vectors
    public fun compare_u8_vector(left: vector<u8>, right: vector<u8>): Result {
        let left_length = vector::length(&left);
        let right_length = vector::length(&right);

        let mut idx = 0;

        while (idx < left_length && idx < right_length) {
            let left_byte = *vector::borrow(&left, idx);
            let right_byte = *vector::borrow(&right, idx);

            if (left_byte < right_byte) {
                return Result { inner: SMALLER }
            } else if (left_byte > right_byte) {
                return Result { inner: GREATER }
            };
            idx = idx + 1;
        };

        if (left_length < right_length) {
            Result { inner: SMALLER }
        } else if (left_length > right_length) {
            Result { inner: GREATER }
        } else {
            Result { inner: EQUAL }
        }
    }

    public fun is_order<X, Y>(): bool {
        let comp = compare(&get<X>(), &get<Y>());
        if (is_smaller_than(&comp)) {
            true
        } else {
            false
        }
    }

    public fun get_amount_out(coin_in: u64,reserve_in: u64,reserve_out: u64):u64{
        let fee_multiplier = FEE_SCALE - FEE_MULTIPLIER;
        let coin_in_val_after_fees = (coin_in as u128) * (fee_multiplier as u128);
        let new_reserve_in = ((reserve_in as u128) * (FEE_SCALE as u128)) + coin_in_val_after_fees;
        muldiv_u128(coin_in_val_after_fees,
            (reserve_out as u128),
            new_reserve_in 
        )
    }

    /*========= entry interfaces =========*/
    public entry fun create_pool<X,Y>(coin_x: Coin<X>, coin_y:Coin<Y>, ctx: &mut TxContext){
        if (!is_order<X,Y>()){
            return create_pool<Y,X>(coin_y,coin_x,ctx)
        };

        let coin_x_balance = coin::into_balance(coin_x);
        let coin_y_balance = coin::into_balance(coin_y);

        let pool = Pool{
            id: object::new(ctx),
            coin_x: coin_x_balance,
            coin_y: coin_y_balance,
            lp_supply: balance::create_supply(LP<X,Y>{}),
        };
        
        emit(CreateEvent{
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
            lp_supply: balance::supply_value(&pool.lp_supply),
        });

        transfer::share_object(pool);
    }

    public entry fun create_pool_empty<X,Y>(ctx: &mut TxContext){
        if (!is_order<X,Y>()){
            return create_pool_empty<Y,X>(ctx)
        };

        let pool = Pool{
            id: object::new(ctx),
            coin_x: balance::zero<X>(),
            coin_y: balance::zero<Y>(),
            lp_supply: balance::create_supply(LP<X,Y>{}),
        };

        emit(CreateEvent{
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
            lp_supply: balance::supply_value(&pool.lp_supply),
        });

        transfer::share_object(pool);
    }

    // swap
    public entry fun swap_x_for_y<X, Y>(pool: &mut Pool<X, Y>,coin_in: Coin<X>,coin_out_min: u64, ctx: &mut TxContext){
        if(!is_order<X,Y>()){
            assert!(false,IS_NOT_ORDER)
        };
        let total_x = balance::value(&pool.coin_x);
        let total_y = balance::value(&pool.coin_y);
        let coin_x_in = coin::value(&coin_in);
        let coin_y_out = get_amount_out( coin_x_in,total_x,total_y);
        assert!(coin_y_out>=coin_out_min,EXCESSIVE_SILIPPAGE);
        let coin_x_balance = coin::into_balance(coin_in);
        balance::join(&mut pool.coin_x, coin_x_balance);
        let coin_out = coin::take(&mut pool.coin_y, coin_y_out, ctx);
        transfer::public_transfer(coin_out, tx_context::sender(ctx));

        emit(SwapEvent{
            amount_x_in: coin_x_in,
            amount_y_in:0,
            amount_x_out: 0,
            amount_y_out:coin_y_out,
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
        });
    }
    
    public entry fun swap_y_for_x<X, Y>(pool: &mut Pool<X, Y>,coin_in: Coin<Y>,coin_out_min: u64, ctx: &mut TxContext){
        if(!is_order<X,Y>()){
            assert!(false,IS_NOT_ORDER)
        };
        let total_x = balance::value(&pool.coin_x);
        let total_y = balance::value(&pool.coin_y);
        let coin_y_in = coin::value(&coin_in);
        let coin_x_out = get_amount_out( coin_y_in,total_y,total_x);
        assert!(coin_x_out>=coin_out_min,EXCESSIVE_SILIPPAGE);
        let coin_y_balance = coin::into_balance(coin_in);
        balance::join(&mut pool.coin_y, coin_y_balance);
        let coin_out = coin::take(&mut pool.coin_x, coin_x_out, ctx);
        transfer::public_transfer(coin_out, tx_context::sender(ctx));

        emit(SwapEvent{
            amount_x_in: 0,
            amount_y_in: coin_y_in,
            amount_x_out: coin_x_out,
            amount_y_out: 0,
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
        });
    }

    public entry fun add_liquidity<X, Y>(pool: &mut Pool<X, Y>, coin_x: Coin<X>, coin_y:Coin<Y>, ctx: &mut TxContext){
        if(!is_order<X,Y>()){
            assert!(false,IS_NOT_ORDER)
        };
        let amount_x = coin::value(&coin_x);
        let amount_y = coin::value(&coin_y);
        let total_x = balance::value(&pool.coin_x);
        let total_y = balance::value(&pool.coin_y);
        let mut coin_x_balance = coin::into_balance(coin_x);
        let mut coin_y_balance = coin::into_balance(coin_y);
        let lp_supply = balance::supply_value(&pool.lp_supply);

        let mut return_x:bool = false;
        let mut return_y:bool = false;
        let mut return_v = 0;

        let provided_liq = if (0 == lp_supply){
            let initial_liq = mulsqrt(amount_x,amount_y) - MINIMUM_LIQUIDITY;
            assert!(initial_liq>0,LIQUID_NOT_ENOUGH);
            initial_liq
        }else{
            let x_liq = muldiv(amount_x,lp_supply,total_x);
            let y_liq = muldiv(amount_y,lp_supply,total_y);
            if (x_liq < y_liq) {
                return_v = amount_y - muldiv(amount_x,total_y,total_x);
                return_y = true;
                (x_liq as u64)
            } else {
                return_v = amount_x - muldiv(amount_y,total_x,total_y);
                return_x = true;
                (y_liq as u64)
            }
        };
        //finalize
        if (return_y){
            transfer::public_transfer(
                coin::from_balance(balance::split(&mut coin_y_balance,return_v),ctx),
                tx_context::sender(ctx)
            );
        };
        if(return_x){
            transfer::public_transfer(
                coin::from_balance(balance::split(&mut coin_x_balance,return_v),ctx),
                tx_context::sender(ctx)
            );
        };

        let record_coin_x_in = balance::value(&coin_x_balance);
        let record_coin_y_in = balance::value(&coin_y_balance);

        balance::join(&mut pool.coin_x, coin_x_balance);
        balance::join(&mut pool.coin_y, coin_y_balance);
        
        let balance = balance::increase_supply(&mut pool.lp_supply,provided_liq);
        transfer::public_transfer(
            coin::from_balance(balance,ctx),
            tx_context::sender(ctx)
        );

        emit(MintEvent{
            amount_x_in: record_coin_x_in,
            amount_y_in: record_coin_y_in,
            lp_out: provided_liq,
            reserve_lp: balance::supply_value(&pool.lp_supply),
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
        });
    }

    public entry fun remove_liquidity<X, Y>(pool: &mut Pool<X, Y>, lp_coin: Coin<LP<X, Y>>, ctx: &mut TxContext){
        if(!is_order<X,Y>()){
            assert!(false,IS_NOT_ORDER)
        };
        let lp_val = coin::value(&lp_coin);
        let total_x = balance::value(&pool.coin_x);
        let total_y = balance::value(&pool.coin_y);
        let lp_total = balance::supply_value(&pool.lp_supply);

        let coin_x_out = muldiv(total_x,lp_val,lp_total);
        let coin_y_out = muldiv(total_y,lp_val,lp_total);

        //finalize
        balance::decrease_supply(&mut pool.lp_supply, coin::into_balance(lp_coin));
        transfer::public_transfer(
            coin::take(&mut pool.coin_x, coin_x_out, ctx),
            tx_context::sender(ctx)
        );
        transfer::public_transfer(
            coin::take(&mut pool.coin_y, coin_y_out, ctx),
            tx_context::sender(ctx)
        );        

        emit(BurnEvent{
            lp_in: lp_val,
            amount_x_out: coin_x_out,
            amount_y_out:coin_y_out,
            reserve_lp: balance::supply_value(&pool.lp_supply),
            reserve_x: balance::value(&pool.coin_x),
            reserve_y: balance::value(&pool.coin_y),
        });

    }

}
