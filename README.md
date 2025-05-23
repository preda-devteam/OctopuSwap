# OctopusSwap: AMM Parallelization Demo on Sui

## Project Overview

This project demonstrates a parallelized AMM swap protocol implementation on Sui blockchain, featuring:

- 🦑 `move_contracts`: Core parallelized Swap contracts
- 📊 `profiling`: Performance benchmarking suite
- 🌐 `api`: Trading backend service
- 🖥️ `ui`: Frontend interface
- 🚀 `scripts`: Deployment & utility scripts

## Key Features

- Parallel-execution optimized AMM implementation
- Benchmark-proven TPS improvements
- Complete swap interface demonstration
- One-click local development setup


## Quick Start

### Prerequisites

- Sui CLI (latest version)
- Node.js 18+
- pnpm
- PostgreSQL (for API module)
- rust env

### Local Network Setup

```shell
# Start local Sui node
./scripts/start_sui_node.sh
```



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

### 📊 Performance Profiling

```
profiling/
├── benchmark/         - Test scenarios
└── results/           - Performance reports
```

**Run Benchmark:**

```shell
./scripts/benchmark.sh
```

### ⚙️ Scripts

- `start_sui_node.sh`: Starts local development network
- `benchmark.sh`: Executes performance comparison tests

------

