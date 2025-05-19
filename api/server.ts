// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import cors from 'cors';
import express, {Request, Response} from 'express';

import { prisma } from './db';
import {
	formatPaginatedResponse,
	parsePaginationForQuery,
	parseWhereStatement,
	WhereParam,
	WhereParamTypes,
} from './utils/api-queries';

const app = express();
app.use(cors());

app.use(express.json());

app.get('/', async (req: Request, res: Response) => {
	res.send({ message: '🚀 API is functional 🚀' });
});

app.get('/price', async (req: Request, res: Response) => {
	try {
		const acceptedQueries: WhereParam[] = [
			{
				key: 'xName',
				type: WhereParamTypes.STRING,
			},
			{
				key: 'yName',
				type: WhereParamTypes.STRING,
			},
		];
		const pools = await prisma.aMM.findMany({
			where: parseWhereStatement(req.query, acceptedQueries)!,
			...parsePaginationForQuery(req.query),
		});

		const globalPool = pools.filter(pool => pool.isGlobal === true)[0];
		const subPools = pools.filter(pool => pool.isGlobal === false);
		const order_pools = subPools.sort((a, b) => {
			const priceA = Number(a.yAmount) / Number(a.xAmount);
			const priceB = Number(b.yAmount) / Number(b.xAmount);
			return priceA - priceB;
		});

		const bestPrice = (Number(order_pools[0].yAmount)*Number(globalPool.parallelism)+ Number(globalPool.yAmount)) / (Number(order_pools[0].xAmount)*Number(globalPool.parallelism) + Number(globalPool.xAmount));
		const price_info = {
			"price": bestPrice,
			"sub_pool_id": order_pools[0].poolId,
			"global_pool_id": globalPool.poolId,
		}
		res.send(formatPaginatedResponse([price_info]));
	} catch (e) {
		console.error(e);
		res.status(400).send(e);
	}
});

app.listen(3030, () => console.log(`🚀 Server ready at: http://localhost:3030`));
