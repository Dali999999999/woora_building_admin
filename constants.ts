import { User, UserRole, Property, VisitRequest, Alert, PropertyType, Attribute, Transaction } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Jean Dupont', email: 'jean@immo.com', phone: '+225 07070701', role: UserRole.AGENT, verified: true, joinDate: '2023-01-15' },
  { id: '2', name: 'Marie Koné', email: 'marie@owner.com', phone: '+225 05050502', role: UserRole.OWNER, verified: true, joinDate: '2023-02-20' },
  { id: '3', name: 'Paul Kouassi', email: 'paul@client.com', phone: '+225 01010103', role: UserRole.CLIENT, verified: false, joinDate: '2023-10-05' },
  { id: '4', name: 'Alice Touré', email: 'alice@client.com', phone: '+225 01010104', role: UserRole.CLIENT, verified: true, joinDate: '2023-11-12' },
];

export const MOCK_PROPERTIES: Property[] = [
  { id: 'p1', title: 'Villa Luxueuse Cocody', price: 150000000, location: 'Abidjan, Cocody', typeId: 'pt1', status: 'active', ownerId: '2', imageUrl: 'https://picsum.photos/400/300', createdAt: '2023-09-01' },
  { id: 'p2', title: 'Appartement F4 Marcory', price: 500000, location: 'Abidjan, Marcory', typeId: 'pt2', status: 'rented', ownerId: '2', imageUrl: 'https://picsum.photos/401/300', createdAt: '2023-10-15' },
  { id: 'p3', title: 'Terrain Bingerville', price: 25000000, location: 'Abidjan, Bingerville', typeId: 'pt3', status: 'pending', ownerId: '1', imageUrl: 'https://picsum.photos/402/300', createdAt: '2023-11-01' },
];

export const MOCK_VISITS: VisitRequest[] = [
  { id: 'v1', propertyId: 'p1', clientId: '3', ownerId: '2', date: '2023-11-20T14:00:00', status: 'pending', message: 'Je suis très intéressé.' },
  { id: 'v2', propertyId: 'p2', clientId: '4', ownerId: '2', date: '2023-11-22T10:00:00', status: 'confirmed' },
  { id: 'v3', propertyId: 'p1', clientId: '4', ownerId: '2', date: '2023-11-18T09:00:00', status: 'rejected' },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', userId: '3', criteria: 'Appartement 3 pièces, Zone 4, Max 600k', createdAt: '2023-11-10', status: 'new' },
  { id: 'a2', userId: '4', criteria: 'Villa avec piscine, Riviera', createdAt: '2023-11-05', status: 'responded' },
];

export const MOCK_ATTRIBUTES: Attribute[] = [
  { id: 'at1', name: 'Piscine', dataType: 'boolean', filterable: true },
  { id: 'at2', name: 'Nombre de pièces', dataType: 'number', filterable: true },
  { id: 'at3', name: 'Surface (m²)', dataType: 'number', filterable: true },
  { id: 'at4', name: 'Garage', dataType: 'boolean', filterable: false },
];

export const MOCK_PROPERTY_TYPES: PropertyType[] = [
  { id: 'pt1', name: 'Villa', description: 'Maison individuelle avec jardin', active: true, attributeIds: ['at1', 'at2', 'at3', 'at4'] },
  { id: 'pt2', name: 'Appartement', description: 'Logement dans un immeuble', active: true, attributeIds: ['at2', 'at3'] },
  { id: 'pt3', name: 'Terrain', description: 'Parcelle nue constructible', active: true, attributeIds: ['at3'] },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', propertyId: 'p2', amount: 1500000, commission: 75000, date: '2023-11-01', status: 'completed' },
  { id: 't2', propertyId: 'p1', amount: 200000, commission: 10000, date: '2023-11-05', status: 'pending' }, // Deposit
];