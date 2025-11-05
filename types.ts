import React from 'react';

export enum Platform {
  Shopify = 'Shopify',
  WooCommerce = 'WooCommerce',
  Manual = 'Manual',
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
  noteObligatoire: string;
  platform: Platform;
  callCount: number;
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
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

// New message template structure
export interface MessageTemplate {
  template: string;
  enabled: boolean;
}

// New granular message template types
export type StatutMessageTemplates = Record<Statut, MessageTemplate>;
export type RamassageMessageTemplates = Record<Ramassage, MessageTemplate>;
export type LivraisonMessageTemplates = Record<Livraison, MessageTemplate>;
// FIX: Corrected typo from Remboursemest to Remboursement.
export type RemboursementMessageTemplates = Record<Remboursement, MessageTemplate>;
export type CommandeRetourMessageTemplates = Record<CommandeRetour, MessageTemplate>;

export interface AllMessageTemplates {
  statut: StatutMessageTemplates;
  ramassage: RamassageMessageTemplates;
  livraison: LivraisonMessageTemplates;
  remboursement: RemboursementMessageTemplates;
  commandeRetour: CommandeRetourMessageTemplates;
}
export type MessageCategory = keyof AllMessageTemplates;


// Types de couleurs pour chaque catégorie
export type StatutColors = Record<Statut, string>;
export type RamassageColors = Record<Ramassage, string>;
export type LivraisonColors = Record<Livraison, string>;
export type RemboursementColors = Record<Remboursement, string>;
export type CommandeRetourColors = Record<CommandeRetour, string>;

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
  password: string; // Note: In a real app, never store plaintext passwords.
  role: Role;
  assignedProductIds: string[];
}

export enum PlatformIntegration {
  Shopify = 'Shopify',
  WooCommerce = 'WooCommerce',
  YouCan = 'YouCan',
}

export interface IntegrationSettings {
  platform: PlatformIntegration;
  isConnected: boolean;
  storeUrl: string;
  apiKey: string;
  apiSecret: string;
}
