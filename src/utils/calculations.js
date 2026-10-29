export function profitability(cost, salePrice) {
  const base = Number(cost)
  if (!base || base <= 0) return 0
  return ((Number(salePrice) - base) / base) * 100
}

export function salePriceFromProfitability(cost, percentage) {
  return Number(cost) * (1 + Number(percentage || 0) / 100)
}

export function expectedCash(cash) {
  if (!cash) return 0
  return Number(cash.initialAmount) + Number(cash.cashSales) + Number(cash.cashMovements || 0)
}
