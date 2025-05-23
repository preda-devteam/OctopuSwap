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

3. [Publish the contract & demo data](#demo-data)

4. Run both the API and the indexer

```
pnpm dev
```

5. Visit [http://localhost:3030/](http://localhost:3000/)

## Demo Data<a name="demo-data"></a>

> Make sure you have enough Testnet (or any net) SUI in the active address of the CLI.

There are some helper functions to:

1. Publish the smart contract
2. Create some demo data (for testnet)

To produce demo data:

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
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI |

### `/getAmountOut`: Returns swapped amount out

Available query parameters:

| Parameter | Expected value    |
| --------- | ----------------- |
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI |
| yAmountIn | 100000000 |

Example:

```
curl 'http://localhost:3030/getAmountOut?xName=08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC&yName=08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI&yAmountIn=100000000'
```
### `/getAmountIn`: Returns swapped amount in

Available query parameters:

| Parameter | Expected value    |
| --------- | ----------------- |
| xName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC |
| yName     | 08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI |
| xAmountOut | 100000000 |

Example:

```
curl 'http://localhost:3030/getAmountIn?xName=08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XBTC&yName=08d71cfac5dd38feb804ab34442cadffb46ed3920b36e608b4786d412ab91762::mycoins::XSUI&xAmountOut=100000000'
```

## Event Indexer

> Run only a single instance of the indexer.

Indexer uses polling to watch for new events. We're saving the
cursor data in the database so we can start from where we left off
when restarting the API.

To run the indexer individually, run:

```
pnpm indexer
```
