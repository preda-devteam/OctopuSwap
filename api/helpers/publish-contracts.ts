// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { publishPackage } from '../sui-utils';

/// A demo showing how we could publish the escrow contract
/// and our DEMO objects contract.
///
/// We're publishing both as part of our demo.
(async () => {
	await publishPackage({
		packagePath: __dirname + '/../../move_contracts/mycoins',
		network: 'localnet',
		exportFileName: 'coin-contract',
	});

	await publishPackage({
		packagePath: __dirname + '/../../move_contracts/amm_parallelization',
		network: 'localnet',
		exportFileName: 'amm-contract',
	});
	
})();
