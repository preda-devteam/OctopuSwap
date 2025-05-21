// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';

import { CONFIG } from '../config';
import { getActiveAddress, getClient, signAndExecute } from '../sui-utils';

const createCoin = async () => {
	// const client = getClient(CONFIG.NETWORK);
	// const tx = new Transaction();
	// tx.moveCall({
	// 	target: `${CONFIG.COIN_CONTRACT}::coin_parallelization::create_coin`,
	// 	typeArguments: [],
	// 	arguments: [],
	// });
	// const address = await getActiveAddress(client);
	// const res = await signAndExecute(client, tx, address);
	// console.log('Successfully created coin.');
};

const createAMMPool = async () => {
	// const client = getClient(CONFIG.NETWORK);
	// const tx = new Transaction();
	// tx.moveCall({
	// 	target: `${CONFIG.AMM_CONTRACT}::amm_parallelization::create_pool`,
	// 	typeArguments: [],
	// 	arguments: [
			
	// 	]});


	// console.log('Successfully created amm.');
};

createAMMPool();
