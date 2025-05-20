#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."
BENCHMARK_DIR="$PROJECT_ROOT/profiling/benchmark"
RESULT_DIR="$PROJECT_ROOT/profiling/results"

cd "$BENCHMARK_DIR" || exit 1

##for test
# echo -e "=== run benchmark tx_num: 100 acc_num: 20 ==="
# cargo run --release -- --parallel --tx_num 10 --acc_num 10 > "$RESULT_DIR/benchmark_amm_parallelization_test.log"
# cargo run --release -- --tx_num 10 --acc_num 10 > "$RESULT_DIR/benchmark_amm_test.log"
# sleep 1m

echo -e "=== run benchmark tx_num: 1000 acc_num: 400 ==="
cargo run --release -- --parallel --tx_num 1000 --acc_num 400 > "$RESULT_DIR/benchmark_amm_parallelization_1000_2.log"
cargo run --release -- --tx_num 1000 --acc_num 400 > "$RESULT_DIR/benchmark_amm_1000_2.log"
sleep 1m

echo -e "=== run benchmark tx_num: 2000 acc_num: 800 ==="
cargo run --release -- --parallel --tx_num 2000 --acc_num 800 > "$RESULT_DIR/benchmark_amm_parallelization_2000.log"
cargo run --release -- --tx_num 2000 --acc_num 800 > "$RESULT_DIR/benchmark_amm_2000.log"
sleep 1m

echo -e "=== run benchmark tx_num: 5000, acc_num: 2000 ==="
cargo run --release -- --parallel --tx_num 5000 --acc_num 2000 > "$RESULT_DIR/benchmark_amm_parallelization_5000.log"
cargo run --release -- --tx_num 5000 --acc_num 2000 > "$RESULT_DIR/benchmark_amm_5000.log"
sleep 1m

echo -e "=== run benchmark tx_num: 10000, acc_num: 4000 ==="
cargo run --release -- --parallel --tx_num 10000 --acc_num 4000 > "$RESULT_DIR/benchmark_amm_parallelization_10000.log"
cargo run --release -- --tx_num 10000 --acc_num 4000 > "$RESULT_DIR/benchmark_amm_10000.log"