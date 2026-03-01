import React from 'react';

export enum Platform {
  Shopify = 'Shopify',
  WooCommerce = 'WooCommerce',
  Manual = 'Manual',
  YouCan = 'YouCan',
  GoogleSheets = 'GoogleSheets',
}

// Nouveaux enums pour les menus déroulants
export enum Statut {
  NonDefini = 'Non défini',
  PasDeReponse = 'PAS DE REPONSE',
  Confirme = 'Confirmé',
  BoiteVocale = 'Boite vocale',
  Annule = 'Annulé',
  Rappel = 'Rappel',
}

export enum Ramassage {
  NonDefini = 'Non défini',
  Ramasser = 'Ramasser',
  NonRamasser = 'Non ramasser',
}

export enum Livraison {
  NonDefini = 'Non défini',
  PasDeReponse = 'PAS DE REPONSE',
  Livre = 'Livrer',
  Reporte = 'Reporter',
  Annule = 'Annulé',
  PriseDeRdv = 'Prise de rendez-vous',
}

export enum Remboursement {
  NonDefini = 'Non défini',
  Payer = 'Payer',
  NonPayer = 'Non-payer',
}

export enum CommandeRetour {
  NonDefini = 'Non défini',
  Retourner = 'Retourner',
  NonRetourne = 'Non retourné',
  Bloquer = 'Bloquer',
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  address: string;
  price: number;
  product: string;
  statut: Statut;
  assignedUserId: string | null;
  noteClient: string;
  ramassage: Ramassage;
  livraison: Livraison;
  remboursement: Remboursement;
  commandeRetour: CommandeRetour;
  platform: Platform;
  callCount: number;
  customFields?: Record<string, string>;
}

export interface Product {
  id: string; // Code article
  name: string; // Nom de produit
  imageUrl: string; // Photo
  initialStock: number;
  purchasePrice: number; // Prix d'achat
  sellingPrice: number; // Prix de vente
  showInOrders?: boolean;
  discount?: number;
  category?: string;
  customFields?: Record<string, string>;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export enum View {
    Dashboard = 'Dashboard',
    Products = 'Products',
    Orders = 'Orders',
    Statistics = 'Statistics',
    Settings = 'Settings',
    AdminPanel = 'AdminPanel',
    Integrations = 'Integrations',
    Clients = 'Clients',
    Financials = 'Financials',
    AIAnalysis = 'AIAnalysis',
    History = 'History',
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  targetId?: string; // ID of the object being modified (e.g., order ID)
  targetType?: 'Order' | 'User' | 'Product' | 'Settings' | 'Auth';
  oldValue?: string;
  newValue?: string;
}

// New message template structure
export interface MessageTemplate {
  template: string;
  enabled: boolean;
}

// New granular message template types
export type StatutMessageTemplates = Record<string, MessageTemplate>;
export type RamassageMessageTemplates = Record<string, MessageTemplate>;
export type LivraisonMessageTemplates = Record<string, MessageTemplate>;
// FIX: Corrected typo from Remboursemest to Remboursement.
export type RemboursementMessageTemplates = Record<string, MessageTemplate>;
export type CommandeRetourMessageTemplates = Record<string, MessageTemplate>;

export interface AllMessageTemplates {
  statut: StatutMessageTemplates;
  ramassage: RamassageMessageTemplates;
  livraison: LivraisonMessageTemplates;
  remboursement: RemboursementMessageTemplates;
  commandeRetour: CommandeRetourMessageTemplates;
}
export type MessageCategory = keyof AllMessageTemplates;


// Types de couleurs pour chaque catégorie
export type StatutColors = Record<string, string>;
export type RamassageColors = Record<string, string>;
export type LivraisonColors = Record<string, string>;
export type RemboursementColors = Record<string, string>;
export type CommandeRetourColors = Record<string, string>;

// Type global pour contenir toutes les configurations de couleurs
export interface AllStatusColors {
  statut: StatutColors;
  ramassage: RamassageColors;
  livraison: LivraisonColors;
  remboursement: RemboursementColors;
  commandeRetour: CommandeRetourColors;
}

export type ColorCategory = keyof AllStatusColors;

export enum Role {
  Admin = 'Admin',
  User = 'User',
  Confirmation = 'Confirmation',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password: string; // Note: In a real app, never store plaintext passwords.
  role: Role;
  assignedProductIds: string[];
  permissions?: View[];
}

export enum PlatformIntegration {
  Shopify = 'Shopify',
  WooCommerce = 'WooCommerce',
  YouCan = 'YouCan',
  GoogleSheets = 'GoogleSheets',
}

export interface Setting {
  setting_key: string;
  setting_value: string;
}

export interface IntegrationSettings {
  platform: PlatformIntegration;
  isConnected: boolean;
  storeUrl: string;
  apiKey: string;
  apiSecret: string;
  spreadsheetId?: string;
  clientEmail?: string;
  privateKey?: string;
}