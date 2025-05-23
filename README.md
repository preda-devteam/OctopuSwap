# OctopuSwap: AMM Parallelization Demo on Sui

## Project Overview
OctopuSwap is Sui's first parallel AMM. 

OctopuSwap is a parallel AMM that restructures a single liquidity pool using multiple parallel shared objects for parallelized transaction, enabling faster and cheaper transactions.

This project demonstrates a parallelized AMM swap protocol implementation on Sui blockchain, featuring:

- 🦑 `move_contracts`: Core parallelized Swap contracts
- 📊 `profiling`: Performance benchmarking suite
- 🌐 `api`: Trading backend service
- 🖥️ `ui`: Frontend interface
- 🚀 `scripts`: Deployment & utility scripts

## Key Advantages:
1. Next-level execution speed
Delivers 2.92× higher effective TPS and 3.5× higher success rate at 5K concurrent swaps—significantly outperforming Sui’s baseline—by structuring a single liquidity pool using parallelized shared-objects.

2. Ultra-Low Gas Fees on Hot Pools
Even the busiest pools stay low-gas. OctopuSwap enhances Sui’s shared object-based local fee market by reducing gas fee contention—leveraging multiple parallelizable shared objects for a single pool.

3. MEV Resistance for the Masses
Parallel execution of the small-volume txns diminishes the effectiveness of MEV strategies, benefiting small-volume traders.


## Quick Start

### Prerequisites

- Sui CLI (latest version)
- Node.js 18+
- pnpm
- PostgreSQL (for API module)


### Backend Service (API)

```shell
cd api

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Database setup
npx prisma migrate deploy
npx prisma generate

# Start server
pnpm dev
```

### Frontend (UI)

```shell
cd ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```


## Module Details

### 📁 move_contracts

```
move_contracts/
├── amm/                - Traditional AMM implementation
├── amm_parallelization/       - Octpus swap core
├── xbtc/               - Wrapped XBTC asset
└── xsui/               - Wrapped XSUI asset
```

### ⚙️ Scripts

- `start_sui_node.sh`: Starts local development network
- `benchmark.sh`: Executes performance comparison tests

------


### 📊 Performance Profiling

```
profiling/
├── benchmark/         - Test scenarios
└── results/           - Performance reports
```


**Local Network Setup**
```shell
# Start local Sui node
./scripts/start_sui_node.sh
```

**Run Benchmark:**

```shell
#result log will be export to sui-demo/profiling/results
./scripts/benchmark.sh 
```

or you can execute the benchmark test manually
```shell
cd sui-demo/profiling/benchmark

#account_num should >= tx_num+2
cargo run --release -- --tx_num <tx_num> --acc_num <account_num> 
```




