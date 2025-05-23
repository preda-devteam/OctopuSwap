// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';

import { CONFIG } from '../config';
import { getActiveAddress, getClient, signAndExecute } from '../sui-utils';

const mintXBTC = async () => {
	const tx = new Transaction();
	const createdObjects = CONFIG.XBTC_CONTRACT.createdObjects;
	const treasuryCap = createdObjects.find((x: { objectType: string; }) => x.objectType === `0x2::coin::TreasuryCap<${CONFIG.XBTC_CONTRACT.packageId}::xbtc::XBTC>`)?.objectId;
	const activeAddress = getActiveAddress();
	tx.moveCall({
		target: `${CONFIG.XBTC_CONTRACT.packageId}::xbtc::mint`,
		typeArguments: [],
		arguments: [tx.object(treasuryCap), tx.pure.u64(100000000000), tx.pure.address(activeAddress)],
	});
	const res = await signAndExecute(tx, CONFIG.NETWORK);
	if (res.errors) {
		console.error('Error creating XBTC:', res.errors);
		return;
	}
	console.log('Successfully created XBTC.', res);
};

const mintXSUI = async () => {
	const tx = new Transaction();
	const createdObjects = CONFIG.XSUI_CONTRACT.createdObjects;
	const treasuryCap = createdObjects.find((x: { objectType: string; }) => x.objectType === `0x2::coin::TreasuryCap<${CONFIG.XSUI_CONTRACT.packageId}::xsui::XSUI>`)?.objectId;
	const activeAddress = getActiveAddress();
	tx.moveCall({
		target: `${CONFIG.XSUI_CONTRACT.packageId}::xsui::mint`,
		typeArguments: [],
		arguments: [tx.object(treasuryCap), tx.pure.u64(3000000000000000), tx.pure.address(activeAddress)],
	});
	const res = await signAndExecute(tx, CONFIG.NETWORK);
	if (res.errors) {
		console.error('Error creating XSUI:', res.errors);
		return;
	}
	console.log('Successfully created XSUI.', res);
};

const createAMMPool = async () => {
	const tx = new Transaction();
	const client = getClient(CONFIG.NETWORK);
	const xbtcObjects = await client.getOwnedObjects({
		filter: {
			StructType: `0x2::coin::Coin<${CONFIG.XBTC_CONTRACT.packageId}::xbtc::XBTC>`,
		},
		options: {
			showContent: true,
			showType: true,
		},
		owner: getActiveAddress(),
	});
	console.log('xbtcObjects', xbtcObjects);
	const xbtcObjectId = xbtcObjects.data.map((x) => {
		return x.data?.objectId;
	})[0]!;
	console.log('xbtcObjectId', xbtcObjectId);


	const xsuiObjects = await client.getOwnedObjects({
		filter: {
			StructType: `0x2::coin::Coin<${CONFIG.XSUI_CONTRACT.packageId}::xsui::XSUI>`,
		},
		options: {
			showContent: true,
			showType: true,
		},
		owner: getActiveAddress(),
	});
	console.log('xsuiObjects', xsuiObjects);
	const xsuiObjectId = xsuiObjects.data.map((x) => {
		return x.data?.objectId;
	})[0]!;
	console.log('xsuiObjectId', xsuiObjectId);

	tx.moveCall({
		target: `${CONFIG.AMM_CONTRACT.packageId}::amm_parallelization::create_pool`,
		typeArguments: [
			`${CONFIG.XBTC_CONTRACT.packageId}::xbtc::XBTC`,
			`${CONFIG.XSUI_CONTRACT.packageId}::xsui::XSUI`,
		],
		arguments: [
			tx.pure.u64(4),
			tx.object(xbtcObjectId),
			tx.object(xsuiObjectId),
		]
	});
	const res = await signAndExecute(tx, CONFIG.NETWORK);
	if (res.errors) {
		console.error('Error creating amm pool:', res.errors);
		return;
	}
	console.log('Successfully created amm pool.', res);
	const createdObjects = res.effects?.created;
};

// mintXBTC();
// mintXSUI();
createAMMPool();