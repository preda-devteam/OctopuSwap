use sdk::pool::SuiAmmClient;
use sui_sdk::types::crypto::{SuiKeyPair,AccountKeyPair,get_key_pair};

const RPC_URL:&str = "http://127.0.0.1:9124";

#[tokio::main]
async fn main() ->Result<(),anyhow::Error>{

    let client = SuiAmmClient::new(RPC_URL).await?;

    let (address,t_keypair) = get_key_pair::<AccountKeyPair>();
    let keypair = SuiKeyPair::from(t_keypair);
    let gas = client.get_gas(&address).await?;
    
    let (mycoins_package_id,coin_manager,amm_package_id,amm_parallelization_package_id) = client.publish_amm_packages(&keypair, gas).await?;
    println!(
        "mycoins_package_id: {:?}, coin_manager: {:?}",
        mycoins_package_id,
        coin_manager
    );
    let mycoin_obj_xsui = client.get_mycoin_obj(
        &keypair, 
        mycoins_package_id,
        gas,
        coin_manager,
        "XSUI",
        1000000000
    ).await?;   

    let mycoin_obj_xbtc = client.get_mycoin_obj(
        &keypair, 
        mycoins_package_id,
        gas,
        coin_manager,
        "XBTC",
        2000000000
    ).await?; 
    println!(
        "mycoin_obj_xsui: {:?}, mycoin_obj_xbtc: {:?}",
        mycoin_obj_xsui,
        mycoin_obj_xbtc
    );

    client.create_pool_amm(
        &keypair,
        mycoins_package_id,
        amm_package_id,
        gas,
        mycoin_obj_xsui,
        mycoin_obj_xbtc,
        true,
    ).await?;

    client.create_pool_amm_parallization(
        &keypair,
        mycoins_package_id,
        amm_parallelization_package_id,
        gas,
        4,
        mycoin_obj_xsui,
        mycoin_obj_xbtc,
        true,
    ).await?;


    Ok(())
}