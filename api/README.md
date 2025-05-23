# AMM API Demo

This demo is built to showcase how we can build an event indexer + API
to efficiently serve on-chain data for our app.

The demo indexer uses polling to watch for new events.

Everything is pre-configured on Testnet, but can be tweaked to work on any other network.
You can change the network by creating a `.env` file with the variable `NETWORK=<mainnet|testnet|devnet|localnet>`

## Installation

1. Install dependencies by running

```
pnpm install --ignore-workspace
```

2. Setup the database by running

```
pnpm db:setup:dev
```

3. [Deploy contracts and create amm pool](#Deploy-contracts)

4. Run both the API and the indexer

```
pnpm dev
```

5. Visit [http://localhost:3030/](http://localhost:3000/)

## Deploy contracts and create amm pool<a name="Deploy-contracts"></a>

> Make sure you have enough Testnet (or any net) SUI in the active address of the CLI.

There are some helper functions to:

1. Publish the smart contract by running

```
npx ts-node helpers/publish-contracts.ts
```

2. Create a pool

```
npx ts-node helpers/create-pool.ts
```


If you want to reset the database (start from scratch), run:

```
pnpm db:reset:dev && pnpm db:setup:dev
```

## API

The API exposes data written from the event indexer.

### `/price`: Return the current price of the pool

Available query parameters:

| Parameter | Expected value    |
| --------- | ----------------- |
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::xbtc::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::xsui::XSUI |

Example Response:
```json
{
    "data": [
        {
            "price": 30000,
            "subPoolId": "0xba656ec405b054bd8eb8fbb46e71b0b59d909c6a866e7e15af10da47bbcdf4d2",
            "globalPoolId": "0x3263d405eb5d3bc151276dada100a732f17a53f3d72e7203fe2a504e59498aa4"
        }
    ]
}
```
> Note: 
>
> price is the best price of the pool.
>
> subPoolId is the subpool id of the pool.
> 
> globalPoolId is the global pool id of the pool.


### `/getAmountOut`: Returns swapped amount out

Available query parameters:

| Parameter | Expected value    |
| --------- | ----------------- |
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::xbtc::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::xsui::XSUI |
| yAmountIn | 100000000 |

Example Response:
```json
{
    "data": [
        {
            "amountOut": 29884142543,
            "subPoolId": "0xba656ec405b054bd8eb8fbb46e71b0b59d909c6a866e7e15af10da47bbcdf4d2",
            "globalPoolId": "0x3263d405eb5d3bc151276dada100a732f17a53f3d72e7203fe2a504e59498aa4",
            "isBlockTrading": false
        }
    ]
}
```
> Note:
>
> amountOut is the amount of coin you will get.
>
> subPoolId is the subpool id of the pool.
>
> globalPoolId is the global pool id of the pool.
>
> isBlockTrading is whether the swap transaction is a block trading.

### `/getAmountIn`: Returns swapped amount in

Available query parameters:

| Parameter | Expected value    |
| --------- | ----------------- |
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI |
| xAmountOut | 100000000 |

Example Response:
```json
{
    "data": [
        {
            "amountIn": 10031,
            "subPoolId": "0xf5adef16f10727bc377d1f4476b46f8c4db02bd7314970c835a95711e009324e",
            "globalPoolId": "0x9dc0ab0be9b8e1a16585ec5ac61475b7c09c7a9f2d61c56a60f590ef39e2901c",
            "isBlockTrading": false
        }
    ]
}
```
> Note:
>
> amountIn is the amount of coin you will pay.
>
> subPoolId is the subpool id of the pool.
>
> globalPoolId is the global pool id of the pool.
>
> isBlockTrading is whether the swap transaction is a block trading.
## Event Indexer

> Run only a single instance of the indexer.

Indexer uses polling to watch for new events. We're saving the
cursor data in the database so we can start from where we left off
when restarting the API.

To run the indexer individually, run:

```
pnpm indexer
```
