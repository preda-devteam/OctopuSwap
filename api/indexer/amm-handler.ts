// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { SuiEvent } from '@mysten/sui/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../db';

type AMMEvent = CreateEvent | MintEvent | BurnEvent | SwapEvent | RebalanceEvent;

type CreateEvent = {
	pool_id: string;
	x_name: string;
	y_name: string;
	reserve_x: string;
	reserve_y: string;
	is_global: boolean;
	lp_supply: string;
	parallelism: string;
};

type MintEvent = {
	pool_id: string;
	amount_x_in: string;
	amount_y_in:string;
	lp_out: string;
	reserve_lp: string;
	reserve_x: string;
	reserve_y: string;
};

type BurnEvent = {
	pool_id: string;
	lp_in: string;
	amount_x_out: string;
	amount_y_out:string;
	reserve_lp: string;
	reserve_x: string;
	reserve_y: string;
};

type SwapEvent = {
	pool_id: string;
	amount_x_in: string;
	amount_y_in:string;
	amount_x_out: string;
	amount_y_out:string;
	reserve_x: string;
	reserve_y: string;
};

type RebalanceEvent = {
	global_pool_id:string;
	shard_pool_id:string;
	reserve_x_g: string;
	reserve_y_g: string;
	reserve_x: string;
	reserve_y: string;
};

/**
 * Handles all events emitted by the `AMM` module.
 * Data is modelled in a way that allows writing to the db in any order (DESC or ASC) without
 * resulting in data incosistencies.
 * We're constructing the updates to support multiple events involving a single record
 * as part of the same batch of events (but using a single write/record to the DB).
 * */
export const handleAMMObjects = async (events: SuiEvent[], type: string) => {
	const updates: Record<string, Prisma.AMMCreateInput> = {};

	for (const event of events) {
		if (!event.type.startsWith(type)) throw new Error('Invalid event module origin');
		console.log('Event:', event.type);
		// AMM swap case
		if (event.type.endsWith('::SwapEvent')) {
			const data = event.parsedJson as SwapEvent;
			console.log('Swap event:', data);
			updates[data.pool_id].poolId = data.pool_id;
			updates[data.pool_id].xAmount = data.reserve_x;
			updates[data.pool_id].yAmount = data.reserve_y;
			continue;
		}
		if (event.type.endsWith('::CreateEvent')) {
			const data = event.parsedJson as CreateEvent;
			console.log('Create event:', data);
			updates[data.pool_id] = {
				poolId: data.pool_id,
				xName: data.x_name,
				yName: data.y_name,
				xAmount: data.reserve_x,
				yAmount: data.reserve_y,
				isGlobal: data.is_global,
				lpSupply: data.lp_supply,
				parallelism: data.parallelism,
			};
			continue;
		}
		if (event.type.endsWith('::MintEvent')) {
			const data = event.parsedJson as MintEvent;
			console.log('Mint event:', data);
			updates[data.pool_id].poolId = data.pool_id;
			updates[data.pool_id].xAmount = data.reserve_x;
			updates[data.pool_id].yAmount = data.reserve_y;
			continue;
		}
		if (event.type.endsWith('::BurnEvent')) {
			const data = event.parsedJson as BurnEvent;
			console.log('Burn event:', data);
			updates[data.pool_id].poolId = data.pool_id;
			updates[data.pool_id].xAmount = data.reserve_x;
			updates[data.pool_id].yAmount = data.reserve_y;
			continue;
		}
		if (event.type.endsWith('::RebalanceEvent')) {
			const data = event.parsedJson as RebalanceEvent;
			console.log('Rebalance event:', data);
			updates[data.shard_pool_id].poolId = data.shard_pool_id;
			updates[data.shard_pool_id].xAmount = data.reserve_x;
			updates[data.shard_pool_id].yAmount = data.reserve_y;
			continue;
		}
	}

	//  As part of the demo and to avoid having external dependencies, we use SQLite as our database.
	// 	Prisma + SQLite does not support bulk insertion & conflict handling, so we have to insert these 1 by 1
	// 	(resulting in multiple round-trips to the database).
	//  Always use a single `bulkInsert` query with proper `onConflict` handling in production databases (e.g Postgres)
	const promises = Object.values(updates).map((update) =>
		prisma.aMM.upsert({
			where: {
				poolId: update.poolId,
			},
			create: update,
			update,
		}),
	);
	await Promise.all(promises);
};
