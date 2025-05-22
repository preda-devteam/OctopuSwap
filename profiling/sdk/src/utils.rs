use sui_sdk::types::crypto::{SuiKeyPair,AccountKeyPair,get_key_pair};
use sui_sdk::types::base_types::SuiAddress;


pub fn generate_accounts(num_accounts:u64)->(Vec<SuiKeyPair>,Vec<SuiAddress>){
    let mut accounts = Vec::<SuiKeyPair>::with_capacity(num_accounts as usize);
    let mut addresses = Vec::<SuiAddress>::with_capacity(num_accounts as usize);
    for _ in 0..num_accounts {
        let (address, keypair) = get_key_pair::<AccountKeyPair>();
        accounts.push(SuiKeyPair::from(keypair));
        addresses.push(address);
    }
    
    (accounts,addresses)

}