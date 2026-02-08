import client from './client';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone_number: string;
    is_verified: boolean;
    is_suspended?: boolean;
    suspension_reason?: string;
    profile_image_url?: string;
    created_at: string;
}


export interface Property {
    id: number;
    owner_id: number;
    status: string;
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
    visit_date: string;
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

export interface PropertyType {
    id: number;
    name: string;
    description?: string;
    attributes?: PropertyAttribute[];
}

export interface PropertyAttribute {
    id: number;
    name: string;
    data_type: 'string' | 'number' | 'boolean' | 'date';
    unit?: string;
    options?: string[];
}

export const authService = {
    login: async (email: string, password: string) => {
        const response = await client.post('/auth/login', { email, password });
        return response.data;
    },
    getProfile: async () => {
        const response = await client.get('/auth/profile');
        return response.data;
    },
    logout: async () => {
        try {
            await client.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors
        }
    },
};

export const userService = {
    getUsers: async (page = 1, limit = 20, search = '', role = 'all') => {
        const response = await client.get('/admin/users', {
            params: {
                page,
                limit,
                search,
                role
            }
        });
        return response.data;
    },
    suspendUser: async (id: number, reason: string) => {
        const response = await client.put(`/admin/users/${id}/suspend`, { reason });
        return response.data;
    },
    unsuspendUser: async (id: number) => {
        const response = await client.put(`/admin/users/${id}/unsuspend`);
        return response.data;
    },
    deleteUser: async (id: number, reason?: string) => {
        // DELETE with body is supported by axios but requires `data` property
        const response = await client.delete(`/admin/users/${id}`, {
            data: { reason }
        });
        return response.data;
    },
};

export const propertyService = {
    getProperties: async () => {
        const response = await client.get('/admin/properties');
        return response.data;
    },
    // Additional specialized calls
    getEligibleBuyers: async (propertyId: number) => {
        const response = await client.get(`/admin/properties/${propertyId}/eligible_buyers`);
        return response.data;
    },
    markAsTransacted: async (propertyId: number, status: 'sold' | 'rented', winningVisitRequestId: number) => {
        const response = await client.put(`/admin/properties/${propertyId}/mark_as_transacted`, {
            status,
            winning_visit_request_id: winningVisitRequestId,
        });
        return response.data;
    },
    validateProperty: async (propertyId: number) => {
        const response = await client.put(`/admin/properties/${propertyId}/validate`);
        return response.data;
    },
    invalidateProperty: async (propertyId: number, reason?: string) => {
        const response = await client.put(`/admin/properties/${propertyId}/invalidate`, { reason });
        return response.data;
    },
    deleteProperty: async (id: number, reason?: string) => {
        const response = await client.delete(`/admin/properties/${id}`, {
            data: { reason }
        });
        return response.data;
    },
    updateProperty: async (id: number, data: any) => {
        const response = await client.put(`/admin/properties/${id}`, data);
        return response.data;
    },
};

export const visitService = {
    getVisitRequests: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await client.get('/admin/visit_requests', { params });
        return response.data;
    },
    confirmVisit: async (requestId: number) => {
        const response = await client.put(`/admin/visit_requests/${requestId}/confirm`);
        return response.data;
    },
    rejectVisit: async (requestId: number, reason: string) => {
        const response = await client.put(`/admin/visit_requests/${requestId}/reject`, { message: reason });
        return response.data;
    },
};

export const configService = {
    getPropertyTypesWithAttributes: async () => {
        const response = await client.get('/admin/property_types_with_attributes');
        return response.data;
    },
    getPropertyStatuses: async () => {
        const response = await client.get('/admin/property-statuses');
        return response.data;
    },
    getAllAttributes: async () => {
        const response = await client.get('/admin/property_attributes');
        return response.data;
    },
    createPropertyType: async (name: string, description?: string) => {
        const response = await client.post('/admin/property_types', { name, description });
        return response.data;
    },
    updatePropertyType: async (id: number, data: any) => {
        const response = await client.put(`/admin/property_types/${id}`, data);
        return response.data;
    },
    deletePropertyType: async (id: number) => {
        await client.delete(`/admin/property_types/${id}`);
    },
    createAttribute: async (data: any) => {
        const response = await client.post('/admin/property_attributes', data);
        return response.data;
    },
    updateAttribute: async (id: number, data: any) => {
        const response = await client.put(`/admin/property_attributes/${id}`, data);
        return response.data;
    },
    deleteAttribute: async (id: number) => {
        await client.delete(`/admin/property_attributes/${id}`);
    },
    updateTypeScopes: async (typeId: number, attributeIds: number[]) => {
        const response = await client.post(`/admin/property_type_scopes/${typeId}`, { attribute_ids: attributeIds });
        return response.data;
    },
};

export const settingsService = {
    getVisitSettings: async () => {
        const response = await client.get('/admin/settings/visits');
        return response.data;
    },
    updateVisitSettings: async (freePasses: number, price: number) => {
        const response = await client.put('/admin/settings/visits', {
            initial_free_visit_passes: freePasses,
            visit_pass_price: price,
        });
        return response.data;
    },
    getAgentCommission: async () => {
        const response = await client.get('/admin/settings/agent_commission');
        return response.data;
    },
    updateAgentCommission: async (percentage: number) => {
        const response = await client.put('/admin/settings/agent_commission', {
            agent_commission_percentage: percentage,
        });
        return response.data;
    },
};

export const requestService = {
    getAll: async (includeArchived = false) => {
        const response = await client.get('/admin/property_requests', {
            params: { include_archived: includeArchived }
        });
        return response.data;
    },
    respond: async (requestId: number, message: string) => {
        const response = await client.post(`/admin/property_requests/${requestId}/respond`, { message });
        return response.data;
    },
    archive: async (requestId: number) => {
        const response = await client.put(`/admin/property_requests/${requestId}/archive`);
        return response.data;
    },
    unarchive: async (requestId: number) => {
        const response = await client.put(`/admin/property_requests/${requestId}/unarchive`);
        return response.data;
    },
};

export const dashboardService = {
    getStats: async () => {
        const response = await client.get('/admin/dashboard/stats');
        return response.data;
    }
};

export const transactionService = {
    getRecents: async () => {
        const response = await client.get('/admin/transactions');
        return response.data;
    }
};
