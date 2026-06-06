import sys
import pandas
import json

def print_postman_payload(csv_file):
    # Load and format
    df = pandas.read_csv(csv_file)
    df['date'] = df['date'].astype(str)
    
    # Build payload
    payload = {
        "sales_data": df.to_dict(orient='records'),
        "horizon": 15,
        "tools": ["weather", "holidays"]
    }
    
    # Just print the raw JSON to stdout
    print(json.dumps(payload, indent=4))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python print_json.py <input.csv>")
        sys.exit(1)
        
    print_postman_payload(sys.argv[1])
