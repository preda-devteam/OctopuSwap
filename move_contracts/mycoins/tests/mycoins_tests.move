#[test_only]
module dex::test_mycoins;

use dex::mycoins;
use sui::event;
use std::debug::print;

#[test_only]
use sui::test_scenario;

#[test]
fun test_mint(){
    let user = @0x123;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    mycoins::init_test(senario.ctx());
    test_scenario::next_tx(senario,user);
    {
        let mut coin_manager = test_scenario::take_shared<mycoins::CoinManager>(senario);
        let mint_amount = 99999999;
        mycoins::mint<mycoins::XSUI>(&mut coin_manager,mint_amount,senario.ctx());
        let events = event::events_by_type<mycoins::CoinMintEvent>();
        print(&events);
        test_scenario::return_shared(coin_manager);
    };


    test_scenario::end(ts); 
}

#[test]
fun test_mint_and_split(){
    let user = @0x123;
    let mut ts = test_scenario::begin(@0x1);
    let senario = &mut ts;
    mycoins::init_test(senario.ctx());
    test_scenario::next_tx(senario,user);
    {
        let mut coin_manager = test_scenario::take_shared<mycoins::CoinManager>(senario);
        let mint_amount = 1000;
        mycoins::mint_and_split<mycoins::XSUI>(&mut coin_manager,mint_amount,5,senario.ctx());
        let events = event::events_by_type<mycoins::CoinMintEvent>();
        print(&events);
        test_scenario::return_shared(coin_manager);
    };


    test_scenario::end(ts); 
}