
pub fn draw_random_swap_compare(){
    // let amm_file = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../results/01_random_swap_compare_amm.csv");
    // let pamm_file = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../results/01_random_swap_compare_pamm.csv");
    // {
    //     let out_path =  PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("pictures/01_random_swap_compare_amountout.png");
    //     let amm_result:Vec<Swap> = Reader::from_path(amm_file)
    //         .unwrap()
    //         .deserialize::<Swap>()
    //         .map(|result| result.unwrap())
    //         .collect();
    //     let pamm_result:Vec<SwapParallelization> = Reader::from_path(pamm_file)
    //         .unwrap()
    //         .deserialize::<SwapParallelization>()
    //         .map(|result| result.unwrap())
    //         .collect();
    //     let amount_out_1: Vec<u64> = amm_result.iter().map(|result| result.amount_out).collect();
    //     let amount_out_2: Vec<u64> = pamm_result.iter().map(|result| result.amount_out).collect();
    //     let primary_pool_txn_nums = pamm_result.iter().filter(|result| result.pool_id == 4).count();
    //     let mut amount_diff_max = 0;
    //     let mut rate:f32 = 0.0;
    //     for i in 0..amount_out_1.len(){
    //         let (diff,order) = if amount_out_1[i] > amount_out_2[i] {
    //             (amount_out_1[i] - amount_out_2[i],true)
    //         }else{
    //             (amount_out_2[i] - amount_out_1[i],false)
    //         };

    //         if diff > amount_diff_max{
    //             amount_diff_max = diff;
    //             if order{
    //                 rate = (amount_diff_max as f32)/(amount_out_1[i] as f32);
    //             }else{
    //                 rate = (amount_diff_max as f32)/(amount_out_2[i] as f32);
    //             }
    //         }
    //     }
    //     println!("amount_diff_max:{}, amount_diff_max_ratio:{}, primary_pool_txn_nums: {}, primary_pool_txn_ratio:{}",amount_diff_max,rate,primary_pool_txn_nums,(primary_pool_txn_nums as f32)/(amount_out_1.len() as f32));
    //     let max_len = amount_out_1.len().max(amount_out_2.len());
    //     let y_max = amount_out_1.iter().chain(amount_out_2.iter()).copied().max().unwrap();
    //     let root = BitMapBackend::new(&out_path, (800, 600)).into_drawing_area();
    //     root.fill(&WHITE).unwrap();
        
    //     let mut chart = ChartBuilder::on(&root)
    //         .caption("Amount Out Comparison",("sans-serif",30))
    //         .margin(10)
    //         .x_label_area_size(40)
    //         .y_label_area_size(60)
    //         .build_cartesian_2d(0..max_len, 0u64..y_max+1000)
    //         .unwrap();

    //     chart.configure_mesh()
    //         .x_desc("Index")
    //         .y_desc("Amount In/Out")
    //         .draw()
    //         .unwrap();
        
    //     chart.draw_series(LineSeries::new(
    //         amount_out_1.iter().enumerate().map(|(i,&y)|(i,y)),
    //         &RED,
    //     ))
    //     .unwrap()
    //     .label("amm standard")
    //     .legend(|(x,y)| PathElement::new(vec![(x,y),(x+20,y)],&RED));

    //     chart.draw_series(LineSeries::new(
    //         amount_out_2.iter().enumerate().map(|(i,&y)|(i,y)),
    //         &BLUE,
    //     ))
    //     .unwrap()
    //     .label("amm parallelization")
    //     .legend(|(x,y)| PathElement::new(vec![(x,y),(x+20,y)],&BLUE));

    //     chart.configure_series_labels()
    //         .position(SeriesLabelPosition::UpperLeft)
    //         .background_style(&WHITE.mix(0.8))
    //         .border_style(&BLACK)
    //         .draw()
    //         .unwrap();
    // }
}