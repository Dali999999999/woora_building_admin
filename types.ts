export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_verified: boolean;
  profile_image_url?: string;
  created_at: string;
}

export interface Property {
  id: number;
  owner_id: number;
  status: { id: number; name: string; color: string } | string;
  created_at: string;
  image_urls: string[];
  attributes: Record<string, any>;
  type?: { id: number; name: string };
  owner?: User;
}

export interface VisitRequest {
  id: number;
  seeker_id: number;
  property_id: number;
  requested_datetime: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  message?: string;
  created_at: string;
  seeker?: User;
  property?: Property;
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
  id: number;
  name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date';
  unit?: string;
  options?: string[];
}

export interface PropertyType {
  id: number;
  name: string;
  description?: string;
  attributes?: PropertyAttribute[];
}