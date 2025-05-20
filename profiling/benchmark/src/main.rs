use anyhow;
use sdk::pool::{SuiAmmClient,RawTransactionData,ComposeOrSubmitTx};
use sdk::utils::generate_accounts;
use sui_sdk::types::{
    base_types::{SuiAddress,ObjectID},
    crypto::{SuiKeyPair},
};
use rand::Rng;
use std::str::FromStr;
use futures::future::join_all;
use std::sync::atomic::{AtomicU32, Ordering};
use tokio::time::{Instant};
use std::sync::Arc;
use sui_json_rpc_types::SuiTransactionBlockEffectsAPI;
use std::env;
use rand::seq::SliceRandom;
use std::fs::OpenOptions;
use std::io::Write;
use tokio::sync::Mutex as AsyncMutex;
use serde::Deserialize;

const RPC_URL:&str = "http://127.0.0.1:9124";

const INIT_XBTC_AMOUNT:u64 = 1000000000;
const INIT_XSUI_AMOUNT:u64 = 2000000000;

const SWAP_MIN_AMOUNT:u64 = 1000;
// const SWAP_THRESHOLD_AMOUNT:u64 = 40000;
const SWAP_MAX_AMOUNT:u64 = 5000;

const PICKUP_MAX_EACH_ACCOUNT:u64 = 5;

const PARALLELISM:u64 = 4;

pub struct AMMSwapAccount {
    pub account: Arc<SuiKeyPair>,
    pub gas_objects: Vec<ObjectID>,
    pub mycoin_obj_collect: Vec<ObjectID>,
    pub mycoin_obj_amount_collect: Vec<u64>,
    pub use_xbtc: bool,
    pub pickup_count: u64,
}

pub fn get_pool_id(response: &sui_sdk::rpc_types::SuiTransactionBlockResponse) -> Option<ObjectID> {
    response
        .object_changes
        .as_ref()?
        .iter()
        .find_map(|change| {
            if let sui_sdk::rpc_types::ObjectChange::Created{ object_type, object_id, .. } = change {
                if object_type.module.as_str() == "amm" 
                    && object_type.name.as_str() == "Pool" {
                    return Some(*object_id);
                }
            }
            None
        })
}

pub fn get_pool_ids(response: &sui_sdk::rpc_types::SuiTransactionBlockResponse) -> (ObjectID, Vec<ObjectID>) {
    let mut global_pool_id = ObjectID::ZERO;
    let mut shard_pool_ids = Vec::new();

    if let Some(events) = &response.events {
        for event in &events.data {
            if event.type_.name.to_string() == "CreateEvent" {
                if let Some(is_global) = event.parsed_json.get("is_global") {
                    if is_global.as_bool().unwrap() {
                        if let Some(pool_id) = event.parsed_json.get("pool_id").and_then(|v| v.as_str()) {
                            global_pool_id = ObjectID::from_str(pool_id).unwrap();
                        }
                    } else {
                        if let Some(pool_id) = event.parsed_json.get("pool_id").and_then(|v| v.as_str()) {
                            shard_pool_ids.push(ObjectID::from_str(pool_id).unwrap());
                        }
                    }
                }
            }
        }
    }
    
    (global_pool_id, shard_pool_ids)
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct ParallelizationSwapEventData {
    pub pool_id: ObjectID,
    pub amount_x_in: u64,
    pub amount_y_in:u64,
    pub amount_x_out: u64,
    pub amount_y_out:u64,
    pub reserve_x: u64,
    pub reserve_y: u64,
    pub reserve_x_estimate: u64,
    pub reserve_y_estimate: u64,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
pub struct SwapEventData {
    pub amount_x_in: u64,
    pub amount_y_in:u64,
    pub amount_x_out: u64,
    pub amount_y_out:u64,
    pub reserve_x: u64,
    pub reserve_y: u64,
}

pub struct SyncLog {
    pub pool_id: ObjectID,
    pub amount_x_in: u64,
    pub amount_y_in:u64,
    pub amount_x_out: u64,
    pub amount_y_out:u64,
    pub reserve_x: u64,
    pub reserve_y: u64,
    pub slippage:f32,
}

pub fn get_swap_event_log(resp: &sui_sdk::rpc_types::SuiTransactionBlockResponse) -> Option<SyncLog> {
    if let Some(events) = &resp.events {
        for event in &events.data {
            if event.type_.name.to_string() == "SwapEvent" {
                if event.type_.module.to_string() == "amm" {
                    let parsed: SwapEventData = bcs::from_bytes(&event.bcs.bytes()).ok()?;
                    return Some(SyncLog {
                        pool_id: ObjectID::ZERO,
                        amount_x_in: parsed.amount_x_in,
                        amount_y_in: parsed.amount_y_in,
                        amount_x_out: parsed.amount_x_out,
                        amount_y_out: parsed.amount_y_out,
                        reserve_x: parsed.reserve_x,
                        reserve_y: parsed.reserve_y,
                        slippage: if parsed.amount_x_out > 0 {
                            parsed.amount_x_out as f32 / parsed.reserve_x as f32
                        } else {
                            parsed.amount_y_out as f32 / parsed.reserve_y as f32
                        },
                    });
                }
                if event.type_.module.to_string() == "amm_parallelization" {
                    let parsed: ParallelizationSwapEventData = bcs::from_bytes(&event.bcs.bytes()).ok()?;
                    return Some(SyncLog {
                        pool_id: parsed.pool_id,
                        amount_x_in: parsed.amount_x_in,
                        amount_y_in: parsed.amount_y_in,
                        amount_x_out: parsed.amount_x_out,
                        amount_y_out: parsed.amount_y_out,
                        reserve_x: parsed.reserve_x, 
                        reserve_y: parsed.reserve_y,
                        slippage: if parsed.amount_x_out > 0 {
                            parsed.amount_x_out as f32 / parsed.reserve_x_estimate as f32
                        } else {
                            parsed.amount_y_out as f32 / parsed.reserve_y_estimate as f32
                        },
                    });
                }
            }
        }
    }
    None
}

fn parse_args(args: &[String]) -> (u64, u64) {
    let mut transaction_num = 1000;
    let mut account_num = 400;
    
    for i in 0..args.len() {
        if args[i] == "--tx_num" && i+1 < args.len() {
            transaction_num = args[i+1].parse().unwrap_or(1000);
        }
        if args[i] == "--acc_num" && i+1 < args.len() {
            account_num = args[i+1].parse().unwrap_or(400);
        }
    }
    (transaction_num, account_num)
}

#[tokio::main]
async fn main()->Result<(),anyhow::Error> {
    let client = SuiAmmClient::new(RPC_URL).await?;

    let args: Vec<String> = env::args().collect();
    let (transaction_num, account_num) = parse_args(&args);
    let mut accounts = generate_accounts(account_num);
    let use_amm_parallelization = args.contains(&"--parallel".to_string());

    println!("use_amm_parallelization:{}...",use_amm_parallelization);

    //deploy and create_pool
    let deployer = accounts.remove(0);
    let deployer_address = SuiAddress::from(&deployer.public());
    let gas = client.get_gas(&deployer_address,1).await?[0];
    let (mycoins_package_id,coin_manager,amm_package_id,amm_parallelization_package_id) = client.publish_amm_packages(&deployer, gas).await?;
    let mycoin_obj_xbtc_amm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XBTC",INIT_XBTC_AMOUNT).await?;   
    let mycoin_obj_xbtc_pamm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XBTC",INIT_XBTC_AMOUNT).await?; 
    let mycoin_obj_xsui_amm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XSUI",INIT_XSUI_AMOUNT).await?; 
    let mycoin_obj_xsui_pamm = client.get_mycoin_obj(&deployer, mycoins_package_id,gas,coin_manager,"XSUI",INIT_XSUI_AMOUNT).await?; 
    let resp_amm_create = client.create_pool_amm(&deployer,mycoins_package_id,amm_package_id,gas,mycoin_obj_xbtc_amm,mycoin_obj_xsui_amm,true,).await?;
    let resp_pamm_create = client.create_pool_amm_parallelization(&deployer,mycoins_package_id,amm_parallelization_package_id,gas,PARALLELISM,mycoin_obj_xbtc_pamm,mycoin_obj_xsui_pamm,true,).await?;

    let pool_id = match &resp_amm_create {
        ComposeOrSubmitTx::Submit(res) => get_pool_id(res).ok_or(anyhow::anyhow!("get pool id from amm error"))?,
        _ => return Err(anyhow::anyhow!("system error"))
    };

    let (global_pool_id,shard_pool_ids) = match &resp_pamm_create {
        ComposeOrSubmitTx::Submit(res) => get_pool_ids(res),
        _ => (ObjectID::ZERO,Vec::new())
    };
    println!("pool_id:{}",pool_id);
    println!("global_pool_id:{}",global_pool_id);
    println!("shard_pool_ids:{:?}",shard_pool_ids);


    //prepare accounts
    let start_time = Instant::now();
    let swap_accounts_amm = prepare_swap_accounts_parallel(&client,accounts,mycoins_package_id,coin_manager).await?;
    // let swap_accounts_amm = prepare_swap_accounts(&client,accounts,mycoins_package_id,coin_manager,).await?;
    let elapsed_time = start_time.elapsed();
    println!("swap_accounts_amm len:{},prepare accounts elapse:{},",swap_accounts_amm.len(),elapsed_time.as_secs_f64());

    //prepare transaction
    let mut raw_transactions = if use_amm_parallelization {
        prepare_amm_parallelization_swap_transactions(
            &client,
            transaction_num,
            account_num-1,
            mycoins_package_id,
            amm_parallelization_package_id,
            swap_accounts_amm,
            global_pool_id,
            shard_pool_ids,
        ).await?
    }else{
        prepare_amm_swap_transactions(
            &client,
            transaction_num,
            account_num-1,
            mycoins_package_id,
            amm_package_id,
            swap_accounts_amm,
            pool_id,
        ).await?
    };
    raw_transactions.shuffle(&mut rand::thread_rng());
    println!("raw_transactions len:{}",raw_transactions.len());

    // //execute transactions
    benchmark_swap_transactions(&client,raw_transactions,use_amm_parallelization).await?;
    Ok(())
}

#[allow(dead_code)]
async fn prepare_swap_accounts(
    client: &SuiAmmClient,
    accounts: Vec<SuiKeyPair>,
    mycoins_package_id:ObjectID,
    coin_manager: ObjectID,
)->Result<Vec<AMMSwapAccount>, anyhow::Error> {
    let mut rng = rand::thread_rng();
    let mut swap_accounts = Vec::<AMMSwapAccount>::with_capacity(accounts.len());
    for account in accounts {
        let account_address = SuiAddress::from(&account.public());
        let gas = client.get_gas(&account_address,PICKUP_MAX_EACH_ACCOUNT).await?;
        let use_xbtc = rng.gen_bool(0.5); 
        let mut mycoin_obj_collect = Vec::<ObjectID>::with_capacity(PICKUP_MAX_EACH_ACCOUNT as usize);
        let mut mycoin_obj_amount_collect = Vec::<u64>::with_capacity(PICKUP_MAX_EACH_ACCOUNT as usize);
        for g in &gas {
            let amount = rng.gen_range(SWAP_MIN_AMOUNT..SWAP_MAX_AMOUNT);
            if use_xbtc {
                let mycoin_obj_xbtc = client.get_mycoin_obj(&account, mycoins_package_id,*g,coin_manager,"XBTC",amount).await?;
                mycoin_obj_collect.push(mycoin_obj_xbtc);
                mycoin_obj_amount_collect.push(amount);
            }else{
                let mycoin_obj_xsui = client.get_mycoin_obj(&account, mycoins_package_id,*g,coin_manager,"XSUI",amount).await?;
                mycoin_obj_collect.push(mycoin_obj_xsui);
                mycoin_obj_amount_collect.push(amount);
            }
        }
        swap_accounts.push(AMMSwapAccount {
            account: account.into(),
            gas_objects: gas,
            mycoin_obj_collect,
            mycoin_obj_amount_collect,
            use_xbtc,
            pickup_count: 0,
        })
    }
    Ok(swap_accounts)
}

#[allow(dead_code)]
async fn prepare_swap_accounts_parallel(
    client: &SuiAmmClient,
    accounts: Vec<SuiKeyPair>,
    mycoins_package_id: ObjectID,
    coin_manager: ObjectID,
) -> Result<Vec<AMMSwapAccount>, anyhow::Error> {
    let mut swap_accounts = Vec::with_capacity(accounts.len());
    let mut tasks = Vec::new();
    for account in accounts.into_iter().map(Arc::new) {
        let client = client.clone();
        let mycoins_package_id = mycoins_package_id;
        let coin_manager = coin_manager;
        
        tasks.push(async move {
            let mut rng = rand::thread_rng();
            let account_address = SuiAddress::from(&account.public());
            let gas = client.get_gas(&account_address, PICKUP_MAX_EACH_ACCOUNT).await?;
            let use_xbtc = rng.gen_bool(0.5);
            let call_gas = gas[0];
            let amount = rng.gen_range(SWAP_MIN_AMOUNT..SWAP_MAX_AMOUNT);
            let mycoin_obj_collect = if use_xbtc {
                client.get_mycoin_obj_and_split(&account, mycoins_package_id, call_gas, coin_manager, "XBTC", amount,PICKUP_MAX_EACH_ACCOUNT).await?
            } else {
                client.get_mycoin_obj_and_split(&account, mycoins_package_id, call_gas, coin_manager, "XSUI", amount,PICKUP_MAX_EACH_ACCOUNT).await?
            };
            // let mut create_tasks = Vec::new();
            // for g in &gas {
            //     let amount = rng.gen_range(SWAP_MIN_AMOUNT..SWAP_MAX_AMOUNT);
            //     let client = client.clone();
            //     let account = Arc::clone(&account);

            //     create_tasks.push(async move {
            //         if use_xbtc {
            //             client.get_mycoin_obj(&account, mycoins_package_id, *g, coin_manager, "XBTC", amount).await
            //         } else {
            //             client.get_mycoin_obj(&account, mycoins_package_id, *g, coin_manager, "XSUI", amount).await
            //         }
            //     });
            // }

            // let mycoin_objs = join_all(create_tasks).await
            //     .into_iter()
            //     .collect::<Result<Vec<_>, _>>()?;

            Ok::<_, anyhow::Error>(AMMSwapAccount {
                account,
                gas_objects: gas.clone(),
                mycoin_obj_collect: mycoin_obj_collect,
                mycoin_obj_amount_collect: vec![amount/PICKUP_MAX_EACH_ACCOUNT; PICKUP_MAX_EACH_ACCOUNT as usize],
                use_xbtc,
                pickup_count: 0,
            })
        });
    }

    for result in join_all(tasks).await {
        swap_accounts.push(result?);
    }

    Ok(swap_accounts)
}

async fn prepare_amm_swap_transactions(
    client: &SuiAmmClient,
    transaction_num:u64,
    account_num:u64,
    mycoins_package_id:ObjectID,
    amm_package_id: ObjectID,
    mut swap_accounts:Vec<AMMSwapAccount>,
    pool_id:ObjectID,
)-> Result< Vec<RawTransactionData>, anyhow::Error> {
    let mut rng = rand::thread_rng();

    let mut raw_transactions_amm = Vec::<RawTransactionData>::with_capacity(transaction_num as usize);
    
    for _ in 0..transaction_num {
        let account = &mut swap_accounts[rng.gen_range(0..account_num as usize)];

        if account.pickup_count >= PICKUP_MAX_EACH_ACCOUNT {
            // println!("account pickup max");
            continue;
        }
        account.pickup_count = account.pickup_count + 1;

        let mycoin_obj = account.mycoin_obj_collect.pop().unwrap();
        let gas = account.gas_objects.pop().unwrap();

        let tx_amm = client.swap_amm(
            &*account.account, 
            mycoins_package_id,
            amm_package_id, 
            gas, 
            pool_id, 
            mycoin_obj, 
            0, 
            account.use_xbtc,
            false
        ).await?;

        let compose_data_amm = match tx_amm {
            ComposeOrSubmitTx::Compose(data) => data,
            _ => return Err(anyhow::anyhow!("Expected compose transaction")),
        };
        raw_transactions_amm.push(compose_data_amm);
    }

    Ok(raw_transactions_amm)
}


async fn prepare_amm_parallelization_swap_transactions(
    client: &SuiAmmClient,
    transaction_num:u64,
    account_num:u64,
    mycoins_package_id:ObjectID,
    amm_parallelization_package_id:ObjectID,
    mut swap_accounts:Vec<AMMSwapAccount>,
    global_pool_id:ObjectID,
    shard_pool_ids:Vec<ObjectID>,
)-> Result<Vec<RawTransactionData>, anyhow::Error> {
    let mut rng = rand::thread_rng();
    let mut raw_transactions_pamm = Vec::<RawTransactionData>::with_capacity(transaction_num as usize);
    
    for _ in 0..transaction_num {
        let account = &mut swap_accounts[rng.gen_range(0..account_num as usize)];

        if account.pickup_count >= PICKUP_MAX_EACH_ACCOUNT {
            // println!("account pickup max");
            continue;
        }
        account.pickup_count = account.pickup_count + 1;

        let pool_index = rng.gen_range(0..shard_pool_ids.len());
        let shard_pool_id = shard_pool_ids[pool_index];

        let mycoin_obj = account.mycoin_obj_collect.pop().unwrap();
        // let amount = account.mycoin_obj_amount_collect.pop().unwrap();
        let gas = account.gas_objects.pop().unwrap();

        let tx_pamm = client.swap_amm_parallelization(
            &*account.account, 
            mycoins_package_id,
            amm_parallelization_package_id, 
            gas, 
            global_pool_id,
            shard_pool_id, 
            mycoin_obj,
            0,
            false,
            account.use_xbtc,
            false
        ).await?;
        
        let compose_data_pamm = match tx_pamm {
            ComposeOrSubmitTx::Compose(data) => data,
            _ => return Err(anyhow::anyhow!("Expected compose transaction")),
        };
        raw_transactions_pamm.push(compose_data_pamm);  
    }

    Ok(raw_transactions_pamm)
}


async fn benchmark_swap_transactions(
    client: &SuiAmmClient,
    transactions:Vec<RawTransactionData>,
    use_amm_parallelization:bool,
)-> Result<(), anyhow::Error> {
    let total_tx = transactions.len() as u32;

    let latency_log_path = if use_amm_parallelization{
        format!("../results/latency_{}_amm_parallelization.log", total_tx)
    }else{
        format!("../results/latency_{}_amm.log", total_tx)
    };

    let swap_event_log_path = if use_amm_parallelization{
        format!("../results/swap_event_{}_amm_parallelization.log", total_tx)
    }else{
        format!("../results/swap_evente_{}_amm.log", total_tx)
    };

    let latency_log = Arc::new(AsyncMutex::new(
        OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&latency_log_path)?
    ));
    writeln!(latency_log.lock().await, "tx_hash,latency(ms)")?;
    let swap_event_log = Arc::new(AsyncMutex::new(
        OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&swap_event_log_path)?
    ));
    writeln!(swap_event_log.lock().await, "tx_hash,pool_id,amount_x_in,amount_y_in,amount_x_out,amount_y_out,reserve_x,reserve_y,slippage")?;

    let start_time = Instant::now();
    let success = Arc::new(AtomicU32::new(0));
    let failure = Arc::new(AtomicU32::new(0));

    let mut tasks = Vec::new();
    for tx in transactions {
        let client = client.clone();
        let success = Arc::clone(&success);
        let failure = Arc::clone(&failure);

        let latency_log = Arc::clone(&latency_log);
        let swap_event_log = Arc::clone(&swap_event_log);

        tasks.push(tokio::spawn(async move {
            let submit_start = Instant::now();
            let resp = client.submit_tx(tx.tx, tx.sig).await;
            let latency = submit_start.elapsed().as_millis();
            match resp {
                Ok(tx_response) => {
                    if let Some(effects) = &tx_response.effects {
                        if effects.status().is_ok() {
                            success.fetch_add(1, Ordering::Relaxed);
                            let swap_event = get_swap_event_log(&tx_response).unwrap();
                            let latency_entry = format!("{},{}\n", tx_response.digest, latency);
                            let swap_event_entry = format!(
                                "{},{},{},{},{},{},{},{},{}\n",
                                tx_response.digest,
                                swap_event.pool_id,
                                swap_event.amount_x_in,
                                swap_event.amount_y_in,
                                swap_event.amount_x_out,
                                swap_event.amount_y_out,
                                swap_event.reserve_x,
                                swap_event.reserve_y,
                                swap_event.slippage
                            );
                            let mut file = latency_log.lock().await;
                            file.write_all(latency_entry.as_bytes()).ok();
                            let mut file = swap_event_log.lock().await;
                            file.write_all(swap_event_entry.as_bytes()).ok();

                        } else {
                            failure.fetch_add(1, Ordering::Relaxed);
                            println!("Transaction failed with status: {:?}", effects.status());
                        }
                    } else {
                        failure.fetch_add(1, Ordering::Relaxed);
                        println!("Transaction failed : {:?}", tx_response);
                    }
                }
                Err(_) => {
                    failure.fetch_add(1, Ordering::Relaxed);
                    println!("response failed : {:?}", resp);
                }
            }
        }));
    }
    
    for task in tasks {
        let _ = task.await;
    }

    let duration = start_time.elapsed();
    let effective_tps = success.load(Ordering::Relaxed) as f64 / duration.as_secs_f64();
    
    println!("\n======== Benchmark Results ========");
    println!("Total transactions: {}", total_tx);
    println!("Successful transactions: {}", success.load(Ordering::Relaxed));
    println!("Failed transactions: {}", failure.load(Ordering::Relaxed));
    println!("Time elapsed: {:.2?}", duration);
    println!("TPS: {:.2} transactions/s", effective_tps);
    println!("====================================\n");


    Ok(())
}
