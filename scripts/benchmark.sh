#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."
BENCHMARK_DIR="$PROJECT_ROOT/profiling/benchmark"
RESULT_DIR="$PROJECT_ROOT/profiling/results"

cd "$BENCHMARK_DIR" || exit 1


cargo run --release -- --parallel --tx_num 1000 --acc_num 1002 > "$RESULT_DIR/benchmark_amm_parallelization_1000.log"
sleep 1m
cargo run --release -- --tx_num 1000 --acc_num 1002 > "$RESULT_DIR/benchmark_amm_1000.log"
sleep 1m

cargo run --release -- --parallel --tx_num 2000 --acc_num 2002 > "$RESULT_DIR/benchmark_amm_parallelization_2000.log"
sleep 1m
cargo run --release -- --tx_num 2000 --acc_num 2002 > "$RESULT_DIR/benchmark_amm_2000.log"
sleep 1m

cargo run --release -- --parallel --tx_num 5000 --acc_num 5002 > "$RESULT_DIR/benchmark_amm_parallelization_5000.log"
sleep 1m
cargo run --release -- --tx_num 5000 --acc_num 5002 > "$RESULT_DIR/benchmark_amm_5000.log"
sleep 1m

cargo run --release -- --parallel --tx_num 10000 --acc_num 10002 > "$RESULT_DIR/benchmark_amm_parallelization_10000.log"
sleep 1m
cargo run --release -- --tx_num 10000 --acc_num 10002 > "$RESULT_DIR/benchmark_amm_10000.log"