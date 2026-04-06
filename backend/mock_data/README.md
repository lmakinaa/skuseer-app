# Manual Integration Test Data

This folder contains ready-to-import mock CSV files for testing:

1) Product catalog import (Settings → Products → Import Products)
2) Sales history import from Settings (Import Sales)
3) Sales history import from Product Detail page (Sales tab → Import Sales CSV)

## Files

- `products_pipe.csv`
  - Delimiter: `|`
  - Columns: `SKU|prod name|category|price|stock|reorder point|forecast|last month|change|accuracy`

- `sales_global_pipe.csv`
  - Delimiter: `|`
  - Columns: `SKU|date|sold quantity`
  - Works with Settings import and Products page import

- `sales_product_P001_no_header_pipe.csv`
  - Delimiter: `|`
  - No header
  - Format per row: `date|sold_quantity`
  - Import from Product page for SKU `P001`

- `sales_product_P001_with_sku_no_header_pipe.csv`
  - Delimiter: `|`
  - No header
  - Format per row: `sku|date|sold_quantity`
  - Also works on Product page import (rows for other SKUs are skipped)

## Suggested quick test flow

1. Import `products_pipe.csv`
2. Import `sales_global_pipe.csv`
3. Open one product (e.g. P001) and verify Sales History chart populates
4. Import `sales_product_P001_no_header_pipe.csv` on that product page and verify updates
5. Create forecast run and confirm status goes `running` → `completed`
