use std::path::PathBuf;
use sui_sdk::{SuiClient, SuiClientBuilder,rpc_types::SuiTransactionBlockResponseOptions};
use sui_sdk::types::{
    base_types::{ObjectID,SuiAddress},
    quorum_driver_types::ExecuteTransactionRequestType,
    transaction::{Transaction, TransactionData},
    crypto::{Signature, SuiKeyPair},
};
use shared_crypto::intent::{Intent,IntentMessage};
use sui_move_build::BuildConfig;
use sui_json_rpc_types::{SuiTransactionBlockResponse,SuiTypeTag, ObjectChange};
use sui_json::SuiJsonValue;
use serde_json::Value;
use reqwest::Client;
use serde_json::json;
use std::str::FromStr;
use sui_types::TypeTag::Struct;

const MYCOIN_PACKAGE_NAME: &str = "mycoins";
const AMM_PACKAGE_NAME: &str = "amm";
const AMM_PARALLELIZATION_PACKAGE_NAME: &str = "amm_parallelization";

const SUI_FAUCET:&str = "http://127.0.0.1:9123/gas";

const AMM_PARALLELIZATION_MODULE_NAME: &str = "amm_parallelization";
const AMM_MODULE_NAME: &str = "amm";
const MYCOIN_MODULE_NAME: &str = "mycoins";

const XSUI: &str = "XSUI";
const XBTC: &str = "XBTC";

const DEFAULT_GAS_BUDGET: u64 = 1000000000;

#[derive(Clone)]
pub struct SuiAmmClient{
    client: SuiClient
}

pub struct RawTransactionData{
    pub tx: TransactionData,
    pub sig: Signature,
}

pub enum ComposeOrSubmitTx {
    Submit(SuiTransactionBlockResponse),
    Compose(RawTransactionData),
}

fn convert_number_to_string(value: Value) -> Value {
    match value {
        Value::Number(n) => Value::String(n.to_string()),
        Value::Array(a) => Value::Array(a.into_iter().map(convert_number_to_string).collect()),
        Value::Object(o) => Value::Object(
            o.into_iter()
                .map(|(k, v)| (k, convert_number_to_string(v)))
                .collect(),
        ),
        _ => value,
    }
}

fn extract_extract_coin_manager(resp: &SuiTransactionBlockResponse) -> Result<ObjectID, anyhow::Error> {
    resp.object_changes
        .iter()
        .flatten()
        .find_map(|change| match change {
            ObjectChange::Created { object_type, object_id, .. } 
                if object_type.module.to_string() == "mycoins"
                    && object_type.name.to_string() == "CoinManager"
                     => Some(*object_id),
            _ => None
        })
        .ok_or_else(|| anyhow::anyhow!("No package ID found in transaction response"))
}

fn extract_package_id(resp: &SuiTransactionBlockResponse) -> Result<ObjectID, anyhow::Error> {
    resp.object_changes
        .iter()
        .flatten()
        .find_map(|change| match change {
            ObjectChange::Published { package_id, .. } => Some(*package_id),
            _ => None
        })
        .ok_or_else(|| anyhow::anyhow!("No package ID found in transaction response"))
}



impl SuiAmmClient{
    pub async fn new(rpc_url: &str) -> Result<Self,anyhow::Error>{
        let client = SuiClientBuilder::default()
            .build(rpc_url)
            .await?;
        
        Ok(Self{
            client
        })
    }

    //get gas object
    pub async fn get_gas(&self, address: &SuiAddress,obj_num: u64) -> Result<Vec<ObjectID>, anyhow::Error>{
        let http_client = Client::new();
        let mut gas_objects = Vec::new();

        while gas_objects.len() < obj_num as usize{
            let response = http_client.post(SUI_FAUCET)
              .json(&json!({
                    "FixedAmountRequest": {
                        "recipient": address.to_string(),
                    }
                }))
              .send()
              .await?;

            let json: serde_json::Value = response.json().await?;
            let batchs = json["coins_sent"]
              .as_array()
              .ok_or_else(|| anyhow::anyhow!("Invalid faucet response format"))?
              .iter()
             .map(|obj| {
                    obj["id"]
                      .as_str()
                      .ok_or_else(|| anyhow::anyhow!("Missing gas object ID"))
                      .and_then(|s| ObjectID::from_str(s).map_err(|e| e.into()))
                })
             .collect::<Result<Vec<_>, _>>()?;

            gas_objects.extend(batchs);
        }

        gas_objects.truncate(obj_num as usize);
            
        Ok(gas_objects)
    }

    //publish package

    pub async fn pay_sui(
        &self,
        keypair: &SuiKeyPair,
        input_coins: Vec<ObjectID>,
        recipients: Vec<SuiAddress>,
        amounts: Vec<u64>,
    )-> Result<SuiTransactionBlockResponse, anyhow::Error>{
        let sender = SuiAddress::from(&keypair.public());
        let tx_data = self.client
                          .transaction_builder()
                          .pay_sui(
                                sender,
                                input_coins,
                                recipients,
                                amounts,
                                500000000,
                            )
                            .await?;
        let signature = Signature::new_secure(&IntentMessage::new(Intent::sui_transaction(),&tx_data),keypair);

        let resp = self.submit_tx(tx_data,signature).await?;
        Ok(resp)
    }

    pub async fn get_sui_coin(
        &self,
        address: &SuiAddress,
    )-> Result<ObjectID, anyhow::Error>{
        let info = self.client
                       .coin_read_api()
                       .get_coins(*address,None,None,None)
                       .await?;
        Ok(info.data[0].coin_object_id)
    }

    pub async fn get_sui_coins(
        &self,
        address: &SuiAddress,
    )-> Result<Vec<ObjectID>, anyhow::Error>{
        let info = self.client
                       .coin_read_api()
                       .get_coins(*address,None,None,None)
                       .await?;
        let coins = info.data.iter().map(|coin| coin.coin_object_id).collect();
        Ok(coins)
    }

    pub async fn publish_amm_packages(
        &self,
        keypair: &SuiKeyPair, 
        gas: ObjectID
    ) -> Result<(ObjectID,ObjectID,ObjectID,ObjectID), anyhow::Error>{
        //publish mycoins
        let resp = self.publish_package(keypair,MYCOIN_PACKAGE_NAME,gas).await?;
        let mycoins_package_id = extract_package_id(&resp)?;
        let coin_manager = extract_extract_coin_manager(&resp)?;

        //publish amm
        let amm_package_id = extract_package_id(
            &self.publish_package(keypair,AMM_PACKAGE_NAME,gas).await?
        )?;

        //publish amm_parallelization
        let amm_parallelization_package_id = extract_package_id(
            &self.publish_package(keypair,AMM_PARALLELIZATION_PACKAGE_NAME,gas).await?
        )?;

        Ok((mycoins_package_id,coin_manager,amm_package_id,amm_parallelization_package_id))
    }

    pub async fn get_mycoin_obj(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id: ObjectID,
        gas: ObjectID, 
        coin_manager: ObjectID, 
        coin_type: &str, 
        coin_amount: u64
    )-> Result<ObjectID, anyhow::Error>{

        let call_args = vec![
            SuiJsonValue::from_object_id(coin_manager),       
            SuiJsonValue::new(serde_json::Value::Number(coin_amount.into()))?,
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,coin_type).to_string()),      
        ];
        let transaction_response = self.invoke(keypair,mycoins_package_id, MYCOIN_MODULE_NAME, "mint", type_args, call_args,gas).await?;

        let coin_obj = transaction_response.object_changes
            .iter()
            .flatten()
            .find_map(|change| match change {
                ObjectChange::Created { object_type, object_id, .. } => {
                    if  object_type.address == *ObjectID::from_str("0x2").unwrap() &&
                        object_type.module.to_string() == "coin"  &&
                        object_type.name.to_string() == "Coin" 
                        {
                            object_type.type_params.iter().find_map(|param| {
                                if let Struct(inner_type) = param {
                                    if inner_type.module.to_string() == MYCOIN_MODULE_NAME 
                                        && inner_type.name.to_string() == coin_type 
                                        && inner_type.address == *mycoins_package_id 
                                    {
                                        return Some(*object_id);
                                    }
                                }
                                None
                            })
                        } else {
                            None
                        }
                    }
                    _ => None
                })
            .ok_or_else(|| anyhow::anyhow!("XSUI coin not found"))?;
        Ok(coin_obj)
    }

    pub async fn get_mycoin_obj_and_split(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id: ObjectID,
        gas: ObjectID, 
        coin_manager: ObjectID, 
        coin_type: &str, 
        coin_amount: u64,
        split_num: u64,
    )-> Result<Vec<ObjectID>, anyhow::Error>{

        let call_args = vec![
            SuiJsonValue::from_object_id(coin_manager),       
            SuiJsonValue::new(serde_json::Value::Number(coin_amount.into()))?,
            SuiJsonValue::new(serde_json::Value::Number(split_num.into()))?,
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,coin_type).to_string()),      
        ];
        let transaction_response = self.invoke(keypair,mycoins_package_id, MYCOIN_MODULE_NAME, "mint_and_split", type_args, call_args,gas).await?;
        // println!("{:?}",transaction_response);
        let coin_obj = transaction_response.object_changes
            .iter()
            .flatten()
            .filter_map(|change| match change {
                ObjectChange::Created { object_type, object_id, .. } => {
                    if  object_type.address == *ObjectID::from_str("0x2").unwrap() &&
                        object_type.module.to_string() == "coin"  &&
                        object_type.name.to_string() == "Coin" 
                        {
                            object_type.type_params.iter().find_map(|param| {
                                if let Struct(inner_type) = param {
                                    if inner_type.module.to_string() == MYCOIN_MODULE_NAME 
                                        && inner_type.name.to_string() == coin_type 
                                        && inner_type.address == *mycoins_package_id 
                                    {
                                        return Some(*object_id);
                                    }
                                }
                                None
                            })
                        } else {
                            None
                        }
                    }
                    _ => None
                })
            .collect();
        Ok(coin_obj)
    }
    /////////////////////////////////////entry function invoke//////////////////////////////////
    pub async fn create_pool_amm(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_package_id: ObjectID,
        gas: ObjectID,
        coin_x: ObjectID,
        coin_y: ObjectID,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let call_args = vec![
            SuiJsonValue::from_object_id(coin_x),
            SuiJsonValue::from_object_id(coin_y),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),  
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()),    
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,
            amm_package_id,
            AMM_MODULE_NAME, 
            "create_pool", 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn create_pool_empty_amm(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_package_id: ObjectID,
        gas: ObjectID,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let call_args = vec![];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()),    
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,
            amm_package_id,
            AMM_MODULE_NAME, 
            "create_pool_empty", 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn swap_amm(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_package_id: ObjectID,
        gas: ObjectID,
        pool: ObjectID,
        coin_in: ObjectID,
        min_amount_out: u64,
        xbtc_to_xsui: bool,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let function_name = if xbtc_to_xsui { 
            "swap_x_for_y"
        } else { 
            "swap_y_for_x"
        };
        let call_args = vec![
            SuiJsonValue::from_object_id(pool),
            SuiJsonValue::from_object_id(coin_in),
            SuiJsonValue::new(serde_json::Value::Number(min_amount_out.into()))?,
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,amm_package_id,
            AMM_MODULE_NAME, 
            function_name, 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn add_liquidity_amm(
        &self,
        keypair: &SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_package_id: ObjectID,
        gas: ObjectID,
        pool: ObjectID,
        coin_x: ObjectID,
        coin_y: ObjectID,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        let call_args = vec![
            SuiJsonValue::from_object_id(pool),
            SuiJsonValue::from_object_id(coin_x),
            SuiJsonValue::from_object_id(coin_y),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data, signature) = self.compose_tx(
            keypair,
            amm_package_id,
            AMM_MODULE_NAME,
            "add_liquidity",
            type_args,
            call_args,
            gas,
        )
        .await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn remove_liquidity_amm(
        &self,
        keypair: &SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_package_id: ObjectID,
        gas: ObjectID,
        pool: ObjectID,
        lp_coin: ObjectID,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        let call_args = vec![
            SuiJsonValue::from_object_id(pool),
            SuiJsonValue::from_object_id(lp_coin),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data, signature) = self.compose_tx(
            keypair,
            amm_package_id,
            AMM_MODULE_NAME,
            "remove_liquidity",
            type_args,
            call_args,
            gas,
        )
        .await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }


    /* amm parallelization*/
    pub async fn create_pool_amm_parallelization(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        parallelism: u64,
        coin_x: ObjectID,
        coin_y: ObjectID,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let call_args = vec![
            SuiJsonValue::new(serde_json::Value::Number(parallelism.into()))?,
            SuiJsonValue::from_object_id(coin_x),
            SuiJsonValue::from_object_id(coin_y),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()),    
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME, 
            "create_pool", 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn create_pool_empty_amm_parallelization(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        parallelism: u64,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let call_args = vec![
            SuiJsonValue::new(serde_json::Value::Number(parallelism.into()))?,
        ];
        let type_args = vec![    
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()),   
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME, 
            "create_pool_empty", 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn swap_amm_parallelization(
        &self,
        keypair:&SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        global_pool: ObjectID,
        shard_pool: ObjectID,
        coin_in: ObjectID,
        min_amount_out: u64,
        is_global:bool,
        xbtc_to_xsui: bool,
        should_submit:bool,
    )->Result<ComposeOrSubmitTx, anyhow::Error>{
        let function_name = if xbtc_to_xsui { 
            if is_global {
                "swap_x_for_y_g"
            }else{
                "swap_x_for_y"
            }
        } else { 
            if is_global {
                "swap_y_for_x_g"
            } else{
                "swap_y_for_x"
            }
        };
        let call_args = vec![
            SuiJsonValue::from_object_id(global_pool),
            SuiJsonValue::from_object_id(shard_pool),
            SuiJsonValue::from_object_id(coin_in),
            SuiJsonValue::new(serde_json::Value::Number(min_amount_out.into()))?,
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data,signature) = self.compose_tx(
            keypair,amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME, 
            function_name, 
            type_args, 
            call_args,
            gas
        ).await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn add_liquidity_amm_parallelization(
        &self,
        keypair: &SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        global_pool: ObjectID,
        shard_pool: ObjectID,
        coin_x: ObjectID,
        coin_y: ObjectID,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        let call_args = vec![
            SuiJsonValue::from_object_id(global_pool),
            SuiJsonValue::from_object_id(shard_pool),
            SuiJsonValue::from_object_id(coin_x),
            SuiJsonValue::from_object_id(coin_y),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data, signature) = self.compose_tx(
            keypair,
            amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME,
            "add_liquidity",
            type_args,
            call_args,
            gas,
        )
        .await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }

    pub async fn remove_liquidity_amm_parallelization(
        &self,
        keypair: &SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        global_pool: ObjectID,
        lp_coin: ObjectID,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        let call_args = vec![
            SuiJsonValue::from_object_id(global_pool),
            SuiJsonValue::from_object_id(lp_coin),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data, signature) = self.compose_tx(
            keypair,
            amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME,
            "remove_liquidity",
            type_args,
            call_args,
            gas,
        )
        .await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }
    
    pub async fn rebalance_amm_parallelization(
        &self,
        keypair: &SuiKeyPair,
        mycoins_package_id:ObjectID,
        amm_parallelization_package_id: ObjectID,
        gas: ObjectID,
        global_pool: ObjectID,
        shard_pool: ObjectID,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        let call_args = vec![
            SuiJsonValue::from_object_id(global_pool),
            SuiJsonValue::from_object_id(shard_pool),
        ];
        let type_args = vec![
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XBTC).to_string()),   
            SuiTypeTag::new(format!("{}::{}::{}",mycoins_package_id,MYCOIN_MODULE_NAME,XSUI).to_string()), 
        ];
        let (tx_data, signature) = self.compose_tx(
            keypair,
            amm_parallelization_package_id,
            AMM_PARALLELIZATION_MODULE_NAME,
            "rebalance",
            type_args,
            call_args,
            gas,
        )
        .await?;

        self.handle_submission(tx_data, signature, should_submit).await
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    pub async fn publish_package(
        &self,
        keypair: &SuiKeyPair, 
        package_name: &str,
        gas: ObjectID
    ) -> Result<SuiTransactionBlockResponse,anyhow::Error>{
        let sender = SuiAddress::from(&keypair.public());
        let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        path.extend(["..","..","move_contracts",package_name]);
        println!("build: {:?}...",path);

        let compiled_package = BuildConfig::new_for_testing().build(&path).unwrap();

        let all_module_bytes =
            compiled_package.get_package_bytes(false);
        let dependencies = compiled_package.get_dependency_storage_package_ids();

        let tx_data = self.client
            .transaction_builder()
            .publish(sender, all_module_bytes, dependencies, Some(gas), DEFAULT_GAS_BUDGET)
            .await?;

        let signature = Signature::new_secure(&IntentMessage::new(Intent::sui_transaction(),&tx_data),keypair);

        let transaction_response = self.submit_tx(tx_data,signature).await?;

        Ok(transaction_response)
    }

    pub async fn compose_tx(
        &self,
        keypair:&SuiKeyPair,
        package_id:ObjectID, 
        module:&str,
        function: &str, 
        type_args: Vec<SuiTypeTag>, 
        call_args: Vec<SuiJsonValue>,
        gas:ObjectID
    ) -> Result<(TransactionData,Signature), anyhow::Error>{
        let sender = SuiAddress::from(&keypair.public());
        let args = call_args
            .into_iter()
            .map(|value| SuiJsonValue::new(convert_number_to_string(value.to_json_value())))
            .collect::<Result<_, _>>()?;

        let type_args = type_args
            .into_iter()
            .map(|arg| arg.try_into())
            .collect::<Result<Vec<_>, _>>()?;        
        let tx_data = self.client
        .transaction_builder()
        .move_call(sender, package_id, module, function, type_args, args, Some(gas), DEFAULT_GAS_BUDGET,None)
        .await?;

        let signature = Signature::new_secure(&IntentMessage::new(Intent::sui_transaction(),&tx_data),keypair);

        Ok((tx_data,signature))
    }

    pub async fn submit_tx(&self,tx_data: TransactionData, signature: Signature) -> Result<SuiTransactionBlockResponse, anyhow::Error>
    {
        let transaction_response  = self.client
            .quorum_driver_api()
            .execute_transaction_block(
                Transaction::from_data(tx_data, vec![signature]),
                SuiTransactionBlockResponseOptions::new().with_object_changes().with_effects().with_events(),
                Some(ExecuteTransactionRequestType::WaitForLocalExecution),
            )
            .await?;
        Ok(transaction_response)
    }

    pub async fn invoke(
        &self,
        keypair:&SuiKeyPair,
        package_id:ObjectID, 
        module:&str, 
        function: &str, 
        type_args: Vec<SuiTypeTag>, 
        call_args: Vec<SuiJsonValue>,
        gas:ObjectID
    ) -> Result<SuiTransactionBlockResponse, anyhow::Error>
    {
        let sender = SuiAddress::from(&keypair.public());
        let args = call_args
            .into_iter()
            .map(|value| SuiJsonValue::new(convert_number_to_string(value.to_json_value())))
            .collect::<Result<_, _>>()?;

        let type_args = type_args
            .into_iter()
            .map(|arg| arg.try_into())
            .collect::<Result<Vec<_>, _>>()?;        
        let tx_data = self.client
        .transaction_builder()
        .move_call(sender, package_id, module, function, type_args, args, Some(gas), DEFAULT_GAS_BUDGET,None)
        .await?;

        let signature = Signature::new_secure(&IntentMessage::new(Intent::sui_transaction(),&tx_data),keypair);

        let transaction_response = self.submit_tx(tx_data,signature).await?;
        Ok(transaction_response)
    }

    async fn handle_submission(
        &self,
        tx_data: TransactionData,
        signature: Signature,
        should_submit: bool,
    ) -> Result<ComposeOrSubmitTx, anyhow::Error> {
        if should_submit {
            let response = self.submit_tx(tx_data, signature).await?;
            Ok(ComposeOrSubmitTx::Submit(response))
        } else {
            Ok(ComposeOrSubmitTx::Compose(RawTransactionData{tx:tx_data, sig:signature}))
        }
    }

}


