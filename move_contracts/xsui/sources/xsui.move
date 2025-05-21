module dex::xsui{
    use sui::coin::{Self,TreasuryCap};

    public struct XSUI has drop{}

    fun init(witness: XSUI, ctx: &mut TxContext){
        let (treasury, metadata) = coin::create_currency(witness, 9, b"XSUI", b"XSUI", b"", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }

    public fun mint(
        treasury_cap: &mut TreasuryCap<XSUI>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext
    ){
        let minted_coin = coin::mint(treasury_cap, amount, ctx);
		transfer::public_transfer(minted_coin, recipient)
    }

}