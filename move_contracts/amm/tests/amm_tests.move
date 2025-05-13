#[test_only]
module dex::amm_tests;
use dex::amm;
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
    
    amm::create_pool<ETH,DAI>(eth_coin,dai_coin,senario.ctx());
    let events = event::events_by_type<amm::CreateEvent>();
    print(&events);
    test_scenario::next_tx(senario, user); 

    // {
    //     let pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
    //     print(&pool);
    //     test_scenario::return_shared(pool);
    // };
    // test_scenario::next_tx(senario, user); 

    test_scenario::end(ts); 
}

#[test]
fun test_swap(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    let eth_coin_for_swap = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_swap = coin::mint_for_testing<DAI>(2000,senario.ctx());
    amm::create_pool<ETH,DAI>(eth_coin,dai_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 

    {
        let mut pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
        print(&pool);
        amm::swap_x_for_y<DAI,ETH>(&mut pool,dai_coin_for_swap,0,senario.ctx());
        let events = event::events_by_type<amm::SwapEvent>();
        print(&events);
        test_scenario::return_shared(pool);
    };
    test_scenario::next_tx(senario, user); 

    {
        let mut pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
        print(&pool);
        amm::swap_y_for_x<DAI,ETH>(&mut pool,eth_coin_for_swap,0,senario.ctx());
        let events = event::events_by_type<amm::SwapEvent>();
        print(&events);
        test_scenario::return_shared(pool);
    };
    test_scenario::next_tx(senario, user); 

    // {
    //     let pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
    //     print(&pool);
    //     test_scenario::return_shared(pool);
    // };
    // test_scenario::next_tx(senario, user); 

    test_scenario::end(ts); 
}


#[test]
fun test_add_liquidity(){
    let user = @0x111;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    let eth_coin = coin::mint_for_testing<ETH>(10000,senario.ctx());
    let dai_coin = coin::mint_for_testing<DAI>(20000,senario.ctx());
    let eth_coin_for_mint = coin::mint_for_testing<ETH>(1000,senario.ctx());
    let dai_coin_for_mint = coin::mint_for_testing<DAI>(5000,senario.ctx());
    amm::create_pool<ETH,DAI>(eth_coin,dai_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 
    {
        let mut pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
        print(&pool);
        amm::add_liquidity<DAI,ETH>(&mut pool,dai_coin_for_mint,eth_coin_for_mint,senario.ctx());
        let events = event::events_by_type<amm::MintEvent>();
        print(&events);
        test_scenario::return_shared(pool);
    };
    test_scenario::next_tx(senario, user); 

    // {
    //     let pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
    //     print(&pool);
    //     test_scenario::return_shared(pool);
    // };
    // test_scenario::next_tx(senario, user);

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
    
    let lp_coin_for_burn = coin::mint_for_testing<amm::LP<DAI,ETH> >(1000,senario.ctx());

    amm::create_pool<ETH,DAI>(eth_coin,dai_coin,senario.ctx());
    test_scenario::next_tx(senario, user); 
    {
        let mut pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
        amm::add_liquidity<DAI,ETH>(&mut pool,dai_coin_for_mint,eth_coin_for_mint,senario.ctx());
        let events = event::events_by_type<amm::MintEvent>();
        print(&events);
        test_scenario::return_shared(pool);
    };

    test_scenario::next_tx(senario, user); 
    {
        let mut pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
        print(&pool);
        amm::remove_liquidity<DAI,ETH>(&mut pool,lp_coin_for_burn,senario.ctx());
        let events = event::events_by_type<amm::BurnEvent>();
        print(&events);
        test_scenario::return_shared(pool);
    };
    test_scenario::next_tx(senario, user); 

    // {
    //     let pool = test_scenario::take_shared<amm::Pool<DAI,ETH> >(senario);
    //     print(&pool);
    //     test_scenario::return_shared(pool);
    // };
    // test_scenario::next_tx(senario, user); 

    test_scenario::end(ts); 
}


