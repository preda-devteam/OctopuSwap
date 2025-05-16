use sui_sdk::types::crypto::{SuiKeyPair,AccountKeyPair,get_key_pair};



pub fn generate_accounts(num_accounts:u64)->Vec<SuiKeyPair>{
    let mut accounts = Vec::<SuiKeyPair>::with_capacity(num_accounts as usize);
    
    for _ in 0..num_accounts {
        let (_, keypair) = get_key_pair::<AccountKeyPair>();
        accounts.push(SuiKeyPair::from(keypair));
    }
    
    accounts

}