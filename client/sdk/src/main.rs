use sdk::pool::SuiAmmClient;
use sui_sdk::types::crypto::{SuiKeyPair,AccountKeyPair,get_key_pair};
use sui_json_rpc_types::{SuiTransactionBlockResponse};
use sui_sdk::types::base_types::ObjectID;
use std::str::FromStr;
use sdk::pool::ComposeOrSubmitTx;

const RPC_URL:&str = "http://127.0.0.1:9124";

pub fn get_pool_ids(response: &SuiTransactionBlockResponse) -> (ObjectID, Vec<ObjectID>) {
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

#[tokio::main]
async fn main() ->Result<(),anyhow::Error>{

    let client = SuiAmmClient::new(RPC_URL).await?;

    let (address,t_keypair) = get_key_pair::<AccountKeyPair>();
    let keypair = SuiKeyPair::from(t_keypair);
    let gas = client.get_gas(&address,1).await?[0];
    
    let (mycoins_package_id,coin_manager,_,amm_parallelization_package_id) = client.publish_amm_packages(&keypair, gas).await?;
    println!(
        "mycoins_package_id: {:?}, coin_manager: {:?}, amm_parallelization_package_id: {:?}",
        mycoins_package_id,
        coin_manager,
        amm_parallelization_package_id
    );
    let mycoin_obj_xbtc = client.get_mycoin_obj(&keypair, mycoins_package_id,gas,coin_manager,"XBTC",1000000000).await?; 
    let mycoin_obj_xsui = client.get_mycoin_obj(&keypair, mycoins_package_id,gas,coin_manager,"XSUI",2000000000).await?;   

    let resp = client.create_pool_amm_parallelization(&keypair,mycoins_package_id,amm_parallelization_package_id,gas,4,mycoin_obj_xbtc,mycoin_obj_xsui,true,).await?;
    let (global_pool_id,shard_pool_ids) = match &resp {
        ComposeOrSubmitTx::Submit(res) => get_pool_ids(res),
        _ => (ObjectID::ZERO,Vec::new())
    };
    println!("global_pool_id:{}",global_pool_id);
    println!("shard_pool_ids:{:?}",shard_pool_ids);
    let mycoin_obj_xbtc_swap = client.get_mycoin_obj(&keypair, mycoins_package_id,gas,coin_manager,"XBTC",1000).await?; 
    let mycoin_obj_xbtc_swap_g = client.get_mycoin_obj(&keypair, mycoins_package_id,gas,coin_manager,"XBTC",20000).await?;
    let mycoin_obj_xsui_swap = client.get_mycoin_obj(&keypair, mycoins_package_id,gas,coin_manager,"XSUI",2000).await?;
    let resp = client.swap_amm_parallelization(&keypair,mycoins_package_id,amm_parallelization_package_id,gas,global_pool_id,shard_pool_ids[0],mycoin_obj_xbtc_swap,0,false,true,true).await?;
    match &resp {
        ComposeOrSubmitTx::Submit(res) => println!("swap resp: {:?}",res),
        _ => return Err(anyhow::anyhow!("system error"))
    };
    let resp = client.swap_amm_parallelization(&keypair,mycoins_package_id,amm_parallelization_package_id,gas,global_pool_id,shard_pool_ids[1],mycoin_obj_xsui_swap,0,false,false,true).await?;
    match &resp {
        ComposeOrSubmitTx::Submit(res) => println!("swap resp: {:?}",res),
        _ => return Err(anyhow::anyhow!("system error"))
    };
    let resp = client.swap_amm_parallelization(&keypair,mycoins_package_id,amm_parallelization_package_id,gas,global_pool_id,shard_pool_ids[2],mycoin_obj_xbtc_swap_g,0,true,true,true).await?;
    match &resp {
        ComposeOrSubmitTx::Submit(res) => println!("swap resp: {:?}",res),
        _ => return Err(anyhow::anyhow!("system error"))
    };

    Ok(())
}