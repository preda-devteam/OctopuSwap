use anyhow;
use sdk::pool::{SuiAmmClient,RawTransactionData};
use sdk::utils::generate_accounts;
use sui_sdk::types::{
    base_types::{SuiAddress},
    transaction::{TransactionData},
    crypto::{Signature},
};
use std::sync::Arc;

const RPC_URL:&str = "http://127.0.0.1:9124";

const INIT_XBTC_AMOUNT:u64 = 1000000000;
const INIT_XSUI_AMOUNT:u64 = 2000000000;

const SWAP_MIN_AMOUNT:u64 = 10000;
const SWAP_THRESHOLD_AMOUNT:u64 = 40000;
const SWAP_MAX_AMOUNT:u64 = 50000;

const TRANSACTION_NUM:u64 = 10000;

#[tokio::main]
async fn main()->Result<(),anyhow::Error> {
    let client = SuiAmmClient::new(RPC_URL).await?;
    let mut accounts = generate_accounts(10000);
    //deploy and create_pool
    let deployer = accounts.remove(0);
    let deployer_address = SuiAddress::from(&deployer.public());
    let v_gas = client.get_gas(&deployer_address,1).await?;
    let gas = v_gas[0];
    let (mycoins_package_id,coin_manager,amm_package_id,amm_parallelization_package_id) = client.publish_amm_packages(&deployer, gas).await?;
    let mycoin_obj_xbtc_amm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XBTC",INIT_XBTC_AMOUNT).await?;   
    let mycoin_obj_xbtc_pamm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XBTC",INIT_XBTC_AMOUNT).await?; 
    let mycoin_obj_xsui_amm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XSUI",INIT_XSUI_AMOUNT).await?; 
    let mycoin_obj_xsui_pamm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XSUI",INIT_XSUI_AMOUNT).await?; 
    client.create_pool_amm(&deployer,mycoins_package_id,amm_package_id,gas,mycoin_obj_xbtc_amm,mycoin_obj_xsui_amm,true,).await?;
    client.create_pool_amm_parallelization(&deployer,mycoins_package_id,amm_parallelization_package_id,gas,4,mycoin_obj_xbtc_pamm,mycoin_obj_xsui_pamm,true,).await?;

    //prepare transaction
    // let (mut raw_transactions_amm, mut raw_transactions_pamm) = prepare_swap_transactions(&client).await?;

    //execute transactions
    // benchmark_swap_transactions(&client,raw_transactions_amm,raw_transactions_pamm).await?;
    Ok(())
}

// async fn prepare_swap_transactions(
//     client: &SuiAmmClient,
//     transaction_num:u64,
//     pool_id:ObjectID,
//     mycoins_package_id:ObjectID,
//     coin_manager: ObjectID,
//     global_pool_id:ObjectID,
//     shard_pool_ids:Vec<ObjectID>,
//     accounts: &[SuiKeyPair],
// )-> Result<(Vec<RawTransactionData>, Vec<RawTransactionData>), anyhow::Error> {
//     let mut raw_transactions_amm = Vec::<RawTransactionData>::with_capacity(transaction_num as usize);
//     let mut raw_transactions_pamm = Vec::<RawTransactionData>::with_capacity(transaction_num as usize);

//     // for _ in 0..transaction_num {
//     //     let account = &accounts[rng.gen_range(0..accounts.len())];
//     //     let amount = rng.gen_range(SWAP_MIN_AMOUNT..SWAP_MAX_AMOUNT);
//     //     let is_global = amount > SWAP_THRESHOLD_AMOUNT;
//     //     let use_xbtc = rng.gen_bool(0.5);
//     //     let pool_id = rng.gen_range(0..shard_pool_ids.len());
//     //     let shard_pool_id = shard_pool_ids[pool_id];

//     //     let tx_swap_amm = client.swap_amm(
//     //         &account,
//     //     ).await?;
        
//     // }

//     Ok((raw_transactions_amm,raw_transactions_pamm))
// }

async fn benchmark_transactions(
    client: &SuiAmmClient,
    transactions:Vec<RawTransactionData>,
)-> Result<(), anyhow::Error> {
    
    let mut tasks = Vec::new();
    for tx in transactions {
        let client = client.clone();
        tasks.push(tokio::spawn(async move {
            let _ = client.submit_tx(tx.tx, tx.sig).await;
        }));
    }
    
    for task in tasks {
        let _ = task.await;
    }

    Ok(())
}
