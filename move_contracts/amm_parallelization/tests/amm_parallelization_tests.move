#[test_only]
module dex::amm_parallelization_tests;
use dex::amm_parallelization;
use sui::coin;
use std::debug::print;
use sui::event;
#[test_only]
use sui::test_scenario;

public struct ETH {}
public struct DAI {}

#[test]
fun test_create_pool(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;

    let eth_coin = coin::mint_for_testing<ETH>(100000000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(200000000,senario.ctx());

    let parallelism:u64 = 4;

    amm_parallelization::create_pool<DAI,ETH>(parallelism,dai_coin,eth_coin,senario.ctx());
    let events = event::events_by_type<amm_parallelization::CreateEvent>();
    print(&events);
    
    test_scenario::next_tx(senario, user); 
    {
        amm_parallelization::create_pool_empty<DAI,ETH>(parallelism,senario.ctx());
        let events = event::events_by_type<amm_parallelization::CreateEvent>();
        print(&events);
    };
    test_scenario::end(ts); 
}

#[test]
fun test_swap(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;

    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    
    let dai_coin_for_swap = coin::mint_for_testing<DAI>(200,senario.ctx());
    let eth_coin_for_swap = coin::mint_for_testing<ETH>(100,senario.ctx());
    let dai_coin_for_swap_g = coin::mint_for_testing<DAI>(1000,senario.ctx());
    let eth_coin_for_swap_g = coin::mint_for_testing<ETH>(500,senario.ctx());

    let parallelism:u64 = 4;

    amm_parallelization::create_pool<DAI,ETH>(parallelism,dai_coin,eth_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 

    let mut global_pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
    let mut pools = vector::empty<amm_parallelization::Pool<DAI,ETH>>();
    let mut i=0;
    while(i < parallelism){
        let pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
        vector::push_back(&mut pools,pool);
        i = i+1;
    };
    vector::reverse(&mut pools);
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow_mut(&mut pools,3);
        amm_parallelization::swap_x_for_y<DAI,ETH>(&global_pool,shard_pool,dai_coin_for_swap,0,senario.ctx());
        let events = event::events_by_type<amm_parallelization::SwapEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow(&pools,2);
        amm_parallelization::swap_x_for_y_g<DAI,ETH>(&mut global_pool,shard_pool,dai_coin_for_swap_g,0,senario.ctx());
        let events = event::events_by_type<amm_parallelization::SwapEvent>();
        print(&events);
    };
    
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow(&pools,1);
        amm_parallelization::swap_y_for_x_g<DAI,ETH>(&mut global_pool,shard_pool,eth_coin_for_swap_g,0,senario.ctx());
        let events = event::events_by_type<amm_parallelization::SwapEvent>();
        print(&events);
    };

    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow_mut(&mut pools,0);
        amm_parallelization::swap_y_for_x<DAI,ETH>(&global_pool,shard_pool,eth_coin_for_swap,0,senario.ctx());
        let events = event::events_by_type<amm_parallelization::SwapEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let mut i = 0;
        while(i < parallelism){
            let pool = vector::borrow(&pools,i);
            print(pool);
            i = i+1;
        };
        print(&global_pool);
    };
     test_scenario::next_tx(senario, user);
     
    //clear
    test_scenario::return_shared(global_pool);
    i=0;
    while(i < parallelism){
        let pool = vector::remove(&mut pools,0);
        test_scenario::return_shared(pool);
        i = i+1;
    };
    vector::destroy_empty(pools);
    test_scenario::end(ts); 
}


#[test]
fun test_add_liquidity(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    let eth_coin_for_mint1 = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_mint1 = coin::mint_for_testing<DAI>(5000,senario.ctx());
    let eth_coin_for_mint2 = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_mint2 = coin::mint_for_testing<DAI>(5000,senario.ctx());

    let parallelism:u64 = 4;
    amm_parallelization::create_pool<DAI,ETH>(parallelism,dai_coin,eth_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 

    let mut global_pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
    let mut pools = vector::empty<amm_parallelization::Pool<DAI,ETH>>();
    let mut i=0;
    while(i < parallelism){
        let pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
        vector::push_back(&mut pools,pool);
        i = i+1;
    };
    vector::reverse(&mut pools);
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow(&pools,0);
        amm_parallelization::add_liquidity<DAI,ETH>(&mut global_pool,shard_pool,dai_coin_for_mint1,eth_coin_for_mint1,senario.ctx());
        let events = event::events_by_type<amm_parallelization::MintEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow(&pools,0);
        amm_parallelization::add_liquidity<DAI,ETH>(&mut global_pool,shard_pool,dai_coin_for_mint2,eth_coin_for_mint2,senario.ctx());
        let events = event::events_by_type<amm_parallelization::MintEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let mut i = 0;
        while(i < parallelism){
            let pool = vector::borrow(&pools,i);
            print(pool);
            i = i+1;
        };
        print(&global_pool);
    };
    test_scenario::next_tx(senario, user); 

    //clear
    test_scenario::return_shared(global_pool);
    i=0;
    while(i < parallelism){
        let pool = vector::remove(&mut pools,0);
        test_scenario::return_shared(pool);
        i = i+1;
    };
    vector::destroy_empty(pools);
    test_scenario::end(ts); 
}

#[test]
fun test_remove_liquidity(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    let eth_coin_for_mint = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_mint = coin::mint_for_testing<DAI>(5000,senario.ctx());
    
    let lp_coin_for_burn = coin::mint_for_testing<amm_parallelization::LP<DAI,ETH> >(1000,senario.ctx());

    let parallelism:u64 = 4;
    amm_parallelization::create_pool<DAI,ETH>(parallelism,dai_coin,eth_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 

    let mut global_pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
    let mut pools = vector::empty<amm_parallelization::Pool<DAI,ETH>>();
    let mut i=0;
    while(i < parallelism){
        let pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
        vector::push_back(&mut pools,pool);
        i = i+1;
    };
    vector::reverse(&mut pools);
    test_scenario::next_tx(senario, user);

    {
        let shard_pool = vector::borrow(&pools,0);
        amm_parallelization::add_liquidity<DAI,ETH>(&mut global_pool,shard_pool,dai_coin_for_mint,eth_coin_for_mint,senario.ctx());
        let events = event::events_by_type<amm_parallelization::MintEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user);

    {
        amm_parallelization::remove_liquidity<DAI,ETH>(&mut global_pool,lp_coin_for_burn,senario.ctx());
        let events = event::events_by_type<amm_parallelization::BurnEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let mut i = 0;
        while(i < parallelism){
            let pool = vector::borrow(&pools,i);
            print(pool);
            i = i+1;
        };
        print(&global_pool);
    };
    test_scenario::next_tx(senario, user); 

    //clear
    test_scenario::return_shared(global_pool);
    i=0;
    while(i < parallelism){
        let pool = vector::remove(&mut pools,0);
        test_scenario::return_shared(pool);
        i = i+1;
    };
    vector::destroy_empty(pools);
    test_scenario::end(ts); 
}


#[test]
fun test_rebalance(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    let eth_coin_for_mint = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_mint = coin::mint_for_testing<DAI>(5000,senario.ctx());
    
    let parallelism:u64 = 4;
    amm_parallelization::create_pool<DAI,ETH>(parallelism,dai_coin,eth_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 

    let mut global_pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
    let mut pools = vector::empty<amm_parallelization::Pool<DAI,ETH>>();
    let mut i=0;
    while(i < parallelism){
        let pool = test_scenario::take_shared<amm_parallelization::Pool<DAI,ETH> >(senario);
        vector::push_back(&mut pools,pool);
        i = i+1;
    };
    vector::reverse(&mut pools);
    test_scenario::next_tx(senario, user);

    {
        let shard_pool = vector::borrow(&pools,0);
        amm_parallelization::add_liquidity<DAI,ETH>(&mut global_pool,shard_pool,dai_coin_for_mint,eth_coin_for_mint,senario.ctx());
        let events = event::events_by_type<amm_parallelization::MintEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user);

    {
        let shard_pool = vector::borrow_mut(&mut pools,0);
        amm_parallelization::rebalance<DAI,ETH>(&mut global_pool,shard_pool);
        let events = event::events_by_type<amm_parallelization::RebalanceEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow_mut(&mut pools,1);
        amm_parallelization::rebalance<DAI,ETH>(&mut global_pool,shard_pool);
        let events = event::events_by_type<amm_parallelization::RebalanceEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow_mut(&mut pools,2);
        amm_parallelization::rebalance<DAI,ETH>(&mut global_pool,shard_pool);
        let events = event::events_by_type<amm_parallelization::RebalanceEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let shard_pool = vector::borrow_mut(&mut pools,3);
        amm_parallelization::rebalance<DAI,ETH>(&mut global_pool,shard_pool);
        let events = event::events_by_type<amm_parallelization::RebalanceEvent>();
        print(&events);
    };
    test_scenario::next_tx(senario, user); 

    {
        let mut i = 0;
        while(i < parallelism){
            let pool = vector::borrow(&pools,i);
            print(pool);
            i = i+1;
        };
        print(&global_pool);
    };
    test_scenario::next_tx(senario, user); 

    //clear
    test_scenario::return_shared(global_pool);
    i=0;
    while(i < parallelism){
        let pool = vector::remove(&mut pools,0);
        test_scenario::return_shared(pool);
        i = i+1;
    };
    vector::destroy_empty(pools);
    test_scenario::end(ts); 
}

