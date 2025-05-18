// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';

import { CONFIG } from '../config';
import { getActiveAddress, getClient, signAndExecute } from '../sui-utils';



const createAMMPool = async () => {
	const txb = new Transaction();

	console.log('Successfully created amm.');
};

createAMMPool();
