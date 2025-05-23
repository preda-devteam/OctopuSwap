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
import { CONFIG } from './config';

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
		const response_info = {
			"price": bestPrice,
			"subPoolId": order_pools[0].poolId,
			"globalPoolId": globalPool.poolId,
		}
		res.send(formatPaginatedResponse([response_info]));
	} catch (e) {
		console.error(e);
		res.status(400).send(e);
	}
});

app.get('/getAmountOut', async (req: Request, res: Response) => {
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
		// X价值越高，排序越靠前
		const order_pools = subPools.sort((a, b) => {
			const priceA = Number(a.yAmount) / Number(a.xAmount);
			const priceB = Number(b.yAmount) / Number(b.xAmount);
			return priceA - priceB;
		});

		let amountOut;
		let subPoolId;
		let isBlockTrading = false;
		if (req.query.xAmountIn !== undefined) {
			const xAmountIn = Number(req.query.xAmountIn);
			amountOut = await getAmountOut(
				xAmountIn,
				Number(globalPool.xAmount) + Number(order_pools[0].xAmount)*4,
				Number(globalPool.yAmount) + Number(order_pools[0].yAmount)*4,
			);
			subPoolId = order_pools[0].poolId;
			if (Number(globalPool.xAmount)/xAmountIn < 1000 || amountOut > Number(order_pools[0].yAmount)) {
				isBlockTrading = true;
			}
		} else if (req.query.yAmountIn !== undefined) {
			const yAmountIn = Number(req.query.yAmountIn);
			amountOut = await getAmountOut(
				yAmountIn,
				Number(globalPool.yAmount) + Number(order_pools[order_pools.length - 1].yAmount)*4,
				Number(globalPool.xAmount) + Number(order_pools[order_pools.length - 1].xAmount)*4,
			);
			subPoolId = order_pools[order_pools.length - 1].poolId;
			if (Number(globalPool.yAmount)/yAmountIn < 1000 || amountOut > Number(order_pools[order_pools.length - 1].xAmount)) {
				isBlockTrading = true;
			}
		} else {
			throw new Error('Please provide either xAmountIn or yAmountIn');
		}

		const response_info = {
			"amountOut": amountOut,
			"subPoolId": subPoolId,
			"globalPoolId": globalPool.poolId,
			"isBlockTrading": isBlockTrading,
		}
		res.send(formatPaginatedResponse([response_info]));
	} catch (e) {
		console.error(e);
		res.status(400).send("" + e);
	}
});

app.get('/getAmountIn', async (req: Request, res: Response) => {
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
		// X价值越高，排序越靠前
		const order_pools = subPools.sort((a, b) => {
			const priceA = Number(a.yAmount) / Number(a.xAmount);
			const priceB = Number(b.yAmount) / Number(b.xAmount);
			return priceA - priceB;
		});

		let amountIn;
		let subPoolId;
		let isBlockTrading = false;
		if (req.query.xAmountOut !== undefined) {
			const xAmountOut = Number(req.query.xAmountOut);
			if (xAmountOut > Number(globalPool.xAmount)) {
				throw new Error('xAmountOut is too large');
			}
			amountIn = await getAmountIn(
				xAmountOut,
				Number(globalPool.yAmount) + Number(order_pools[order_pools.length - 1].yAmount)*4,
				Number(globalPool.xAmount) + Number(order_pools[order_pools.length - 1].xAmount)*4,
			);
			subPoolId = order_pools[order_pools.length - 1].poolId;
			if (Number(globalPool.xAmount)/xAmountOut < 1000 || xAmountOut > Number(order_pools[order_pools.length - 1].xAmount)) {
				isBlockTrading = true;
			}
		} else if (req.query.yAmountOut !== undefined) {
			const yAmountOut = Number(req.query.yAmountOut);
			if (yAmountOut > Number(globalPool.yAmount)) {
				throw new Error('yAmountOut is too large');
			}
			amountIn = await getAmountIn(
				yAmountOut,
				Number(globalPool.xAmount) + Number(order_pools[0].xAmount)*4,
				Number(globalPool.yAmount) + Number(order_pools[0].yAmount)*4,
			);
			subPoolId = order_pools[0].poolId;
			if (Number(globalPool.yAmount)/yAmountOut < 1000 || yAmountOut > Number(order_pools[0].yAmount)) {
				isBlockTrading = true;
			}
		} else {
			throw new Error('Please provide either xAmountIn or yAmountIn');
		}

		const response_info = {
			"amountIn": amountIn,
			"subPoolId": subPoolId,
			"globalPoolId": globalPool.poolId,
			"isBlockTrading": isBlockTrading,
		}
		res.send(formatPaginatedResponse([response_info]));
	} catch (e) {
		console.error(e);
		res.status(400).send("" + e);
	}
});

app.listen(CONFIG.PORT, () => console.log(`🚀 Server ready at: http://localhost:${CONFIG.PORT}`));

const getAmountOut = async (
	amountIn: number,
	reserveIn: number,
	reserveOut: number,
): Promise<number> => {
	const amountInWithFee = amountIn * 997;
	const numerator = amountInWithFee * reserveOut;
	const denominator = reserveIn * 1000 + amountInWithFee;
	const amountOut = Math.floor(numerator/denominator);
	return amountOut;
};

const getAmountIn = async (
    amountOut: number,
    reserveIn: number,
    reserveOut: number,
  ): Promise<number> => {
    const numerator = reserveIn * amountOut * 1000;
    const denominator = (reserveOut-amountOut) * 997;
    const amountIn = Math.floor(numerator / denominator) + 1;
    return amountIn;
  };