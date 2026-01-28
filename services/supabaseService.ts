import { supabase } from './supabaseClient';
import { AppData, Store, Order, AppSettings } from '../types';

export const supabaseService = {
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async signInWithEmail(email: string) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async loadAllData(): Promise<AppData | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Load Settings
        const { data: settingsData } = await supabase
            .from('app_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Load Stores
        const { data: storesData } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        // Load Orders with Lines
        const { data: ordersData } = await supabase
            .from('orders')
            .select('*, order_lines(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        return {
            settings: settingsData ? {
                rules: settingsData.rules,
                billing: settingsData.billing,
                statuses: settingsData.statuses,
                models: settingsData.models,
                colors: settingsData.colors,
                lineTypes: settingsData.line_types,
                version: settingsData.version
            } : null as any,
            stores: (storesData || []).map(s => ({
                id: s.id,
                name: s.name,
                city: s.city,
                address: s.address,
                postalCode: s.postal_code,
                province: s.province,
                country: s.country,
                nif: s.nif,
                contact: s.contact,
                email: s.email,
                phone: s.phone,
                instagram: s.instagram,
                notes: s.notes,
                requiresRE: s.requires_re
            })),
            orders: (ordersData || []).map(o => ({
                id: o.id,
                storeId: o.store_id,
                number: o.number,
                invoiceNumber: o.invoice_number,
                date: o.date,
                status: o.status,
                shippingPolicy: o.shipping_policy,
                shippingCost: Number(o.shipping_cost),
                freeFromPVD: Number(o.free_from_pvd),
                notes: o.notes,
                shippingOverride: o.shipping_override,
                lines: (o.order_lines || []).map((l: any) => ({
                    id: l.id,
                    type: l.type,
                    model: l.model,
                    color: l.color,
                    name: l.name,
                    qty: l.qty,
                    sku: l.sku,
                    pvdUnit: Number(l.pvd_unit),
                    pvpUnit: Number(l.pvp_unit)
                }))
            }))
        };
    },

    async saveStore(store: Store) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            name: store.name,
            city: store.city,
            address: store.address,
            postal_code: store.postalCode,
            province: store.province,
            country: store.country,
            nif: store.nif,
            contact: store.contact,
            email: store.email,
            phone: store.phone,
            instagram: store.instagram,
            notes: store.notes,
            requires_re: store.requiresRE
        };

        // Try to update first, if nothing updated, then insert
        const { data: existing } = await supabase
            .from('stores')
            .select('id')
            .eq('id', store.id)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('stores')
                .update(payload)
                .eq('id', store.id);
            if (error) throw error;
            return store.id;
        } else {
            const { data, error } = await supabase
                .from('stores')
                .insert([{ ...payload, id: store.id }])
                .select()
                .single();
            if (error) throw error;
            return data.id;
        }
    },

    async deleteStore(id: string) {
        const { error } = await supabase.from('stores').delete().eq('id', id);
        if (error) throw error;
    },

    async saveOrder(order: Order) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const orderPayload = {
            user_id: user.id,
            store_id: order.storeId,
            number: order.number,
            invoice_number: order.invoiceNumber,
            date: order.date,
            status: order.status,
            shipping_policy: order.shippingPolicy,
            shipping_cost: order.shippingCost,
            free_from_pvd: order.freeFromPVD,
            notes: order.notes,
            shipping_override: order.shippingOverride
        };

        const { data: existing } = await supabase
            .from('orders')
            .select('id')
            .eq('id', order.id)
            .single();

        let orderId = order.id;

        if (existing) {
            const { error } = await supabase
                .from('orders')
                .update(orderPayload)
                .eq('id', order.id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase
                .from('orders')
                .insert([{ ...orderPayload, id: order.id }])
                .select()
                .single();
            if (error) throw error;
            orderId = data.id;
        }

        // Handle Lines (Simple approach: delete and re-insert)
        await supabase.from('order_lines').delete().eq('order_id', orderId);

        const linesPayload = order.lines.map(l => ({
            order_id: orderId,
            type: l.type,
            model: l.model,
            color: l.color,
            name: l.name,
            qty: l.qty,
            sku: l.sku,
            pvd_unit: l.pvdUnit,
            pvp_unit: l.pvpUnit
        }));

        if (linesPayload.length > 0) {
            const { error: linesError } = await supabase.from('order_lines').insert(linesPayload);
            if (linesError) throw linesError;
        }

        return orderId;
    },

    async deleteOrder(id: string) {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
    },

    async saveSettings(settings: AppSettings) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            rules: settings.rules,
            billing: settings.billing,
            statuses: settings.statuses,
            models: settings.models,
            colors: settings.colors,
            line_types: settings.lineTypes,
            version: settings.version
        };

        const { error } = await supabase
            .from('app_settings')
            .upsert(payload, { onConflict: 'user_id' });

        if (error) throw error;
    }
};
