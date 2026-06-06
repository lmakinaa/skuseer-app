import pandas
import numpy
import os
from datetime import datetime

NUM_SKUS = 10
YEARS_OF_DATA = 5
START_DATE = "2021-01-01"
OUTPUT_FILE = "dummy_data/multi_product_sales_massive.csv"

def generate_sales_data(num_skus, years, start_date):
    print(f"==/ Generating realistic sales data for {num_skus} SKUs over {years} years...")
    
    start = pandas.to_datetime(start_date)
    days = int(years * 365.25)
    date_range = pandas.date_range(start=start, periods=days, freq='D')
    
    all_data = []
    
    for i in range(1, num_skus + 1):
        sku_name = f"SKU_{chr(64+i) if i <= 26 else str(i).zfill(3)}" # SKU_A, SKU_B, etc.
        
        base_sales = numpy.random.randint(500, 2000)
        
        t = numpy.arange(days)
        
        weekly_wave = numpy.sin(t * (2 * numpy.pi / 7)) * (base_sales * 0.15)
        
        yearly_wave = numpy.sin(t * (2 * numpy.pi / 365.25)) * (base_sales * 0.25)
        
        trend = t * numpy.random.uniform(-0.1, 0.2)
        
        noise = numpy.random.normal(0, base_sales * 0.05, days)
        
        sales = base_sales + weekly_wave + yearly_wave + trend + noise
        
        sales = numpy.maximum(sales, 0).astype(int)
        
        sku_df = pandas.DataFrame({
            'product_id': sku_name,
            'date': date_range,
            'sales': sales
        })
        
        all_data.append(sku_df)
        
    final_df = pandas.concat(all_data, ignore_index=True)
    return final_df

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    df = generate_sales_data(NUM_SKUS, YEARS_OF_DATA, START_DATE)
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"==/ Success! Created {len(df)} rows of data.")
    print(f"==/ Saved to: {OUTPUT_FILE}")
