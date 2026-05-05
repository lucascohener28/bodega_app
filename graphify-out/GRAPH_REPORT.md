# Graph Report - inventario-bodega  (2026-04-28)

## Corpus Check
- 19 files · ~21,163 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 57 nodes · 57 edges · 7 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `buildPrintableHtml()` - 5 edges
2. `loadProductsData()` - 4 edges
3. `refreshAll()` - 4 edges
4. `loadPendientes()` - 3 edges
5. `loadHistorial()` - 3 edges
6. `init()` - 3 edges
7. `fetchJson()` - 3 edges
8. `calcularSubtotalPagar()` - 2 edges
9. `itemSafeUnits()` - 2 edges
10. `formatGs()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `loadProductsData()` --calls--> `fetchJson()`  [INFERRED]
  src\App.tsx → src\lib\api.ts
- `loadData()` --calls--> `fetchJson()`  [INFERRED]
  src\App.tsx → src\lib\api.ts

## Communities

### Community 1 - "Community 1"
Cohesion: 0.33
Nodes (5): fetchJson(), handleCreateProduct(), handleUpdateProduct(), loadData(), loadProductsData()

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (5): handleCerrarLiquidacion(), init(), loadHistorial(), loadPendientes(), refreshAll()

### Community 3 - "Community 3"
Cohesion: 0.4
Nodes (5): buildPrintableHtml(), formatDateTime(), formatGs(), handleDownloadPdf(), handlePrintLiquidacion()

### Community 4 - "Community 4"
Cohesion: 0.6
Nodes (4): formatGsPdf(), formatPackBreakdown(), generarPDFLiquidacion(), getPackMetrics()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (2): calcularSubtotalPagar(), itemSafeUnits()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (2): handleConfirmSale(), loadProducts()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): formatPackBreakdown(), getPackMetrics()

## Knowledge Gaps
- **Thin community `Community 5`** (4 nodes): `liquidaciones.routes.ts`, `calcularSubtotalPagar()`, `itemSafeUnits()`, `obtenerRangoPeriodo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `handleConfirmSale()`, `loadProducts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `formatPackBreakdown()`, `getPackMetrics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `loadProductsData()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `loadData()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._