export interface User {
  id: number | string;
  name?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  phone?: string;
  role: string | UserRole;
  is_verified?: boolean;
  verified?: boolean;
  profile_image_url?: string;
  created_at?: string;
  joinDate?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  OWNER = 'owner',
  CLIENT = 'customer'
}

export interface Property {
  id: number | string;
  owner_id?: number | string;
  status: { id: number; name: string; color: string } | string;
  created_at?: string;
  createdAt?: string;
  image_urls?: string[];
  imageUrl?: string;
  attributes?: Record<string, any>;
  type?: { id: number; name: string };
  typeId?: string;
  owner?: User;
  ownerId?: string;
  is_validated?: boolean;
  title?: string;
  price?: number;
  city?: string;
  location?: string;
  owner_details?: {
    first_name?: string;
    last_name?: string;
  };
  property_status?: {
    id: number;
    name: string;
    color: string;
  };
  status_id?: number;
  active?: boolean;
  attributeIds?: string[];
}

export interface VisitRequest {
  id: number | string;
  seeker_id?: number;
  property_id?: number;
  propertyId?: string;
  clientId?: string;
  ownerId?: string;
  requested_datetime?: string;
  date?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled' | 'accepted';
  message?: string;
  created_at?: string;
  seeker?: User;
  property?: Property;
  property_title?: string;
  customer_name?: string;
  referral?: {
    id: number;
    code: string;
    agent_name: string;
    agent_email?: string;
  };
}

export interface PropertyRequest {
  id: number;
  user_id: number;
  criteria: Record<string, any>;
  status: string;
  created_at: string;
  user?: User;
}

export interface PropertyAttribute {
  id: number | string;
  name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date';
  dataType?: string;
  unit?: string;
  options?: string[];
  filterable?: boolean;
}

export interface PropertyType {
  id: number | string;
  name: string;
  description?: string;
  attributes?: PropertyAttribute[];
  active?: boolean;
  attributeIds?: string[];
}

export interface Alert {
  id: number | string;
  request_details: string;
  city: string;
  min_price: number;
  max_price: number;
  status: 'new' | 'in_progress' | 'contacted' | 'closed' | 'responded';
  created_at: string;
  createdAt?: string;
  archived_at: string | null;
  archived_by: number | null;
  customer: User | null;
  customer_id?: number;
  userId?: string;
  criteria?: string;
  property_type_name: string;
  admin_response?: string;
}

export interface Attribute {
  id: string;
  name: string;
  dataType: string;
  filterable: boolean;
}

export interface Transaction {
  id: string;
  propertyId: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
}