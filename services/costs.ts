import { Product } from '../types';
import { mockProducts } from './mockData';

export interface CostStructure {
  fixed: {
    product_cost: number;
    packaging: number;
    wifi: number;
    rent: number;
    transport: number;
  };
  variable: {
    facebook_ads: number;
    tiktok_ads: number;
    calls: number;
    delivery: number;
  };
}

// Generate some realistic-looking costs based on product purchase price.
const generateCosts = (product: Product): CostStructure => {
  const purchasePrice = product.purchasePrice;
  return {
    fixed: {
      product_cost: purchasePrice,
      packaging: 5,
      wifi: 1,
      rent: 3,
      transport: 4,
    },
    variable: {
      facebook_ads: purchasePrice * 0.1,
      tiktok_ads: purchasePrice * 0.08,
      calls: 2,
      delivery: 10,
    }
  };
};

export const productCosts: Record<string, CostStructure> = mockProducts.reduce((acc, product) => {
  acc[product.id] = generateCosts(product);
  return acc;
}, {} as Record<string, CostStructure>);
