import { supabase } from './supabaseClient';
import { AppData, Store, Order, AppSettings } from '../types';

export const supabaseService = {
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async signInWithEmail(email: string) {
        // En producción (Vercel), window.location.origin debería ser la URL correcta.
        // Si tienes problemas, puedes forzar una URL en .env con VITE_REDIRECT_URL
        const redirectTo = import.meta.env.VITE_REDIRECT_URL || window.location.origin;

        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectTo,
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

        // Load Deposits
        const { data: depositsData } = await supabase
            .from('deposits')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        // Load Supplier Invoices
        const { data: invoicesData } = await supabase
            .from('supplier_invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        // Load Raw Stock
        const { data: rawStockData } = await supabase
            .from('raw_stock')
            .select('*')
            .eq('user_id', user.id)
            .order('item_name');

        // Load Manufactured Stock
        const { data: manufacturedStockData } = await supabase
            .from('manufactured_stock')
            .select('*')
            .eq('user_id', user.id);

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
            })),
            deposits: (depositsData || []).map(d => ({
                id: d.id,
                storeId: d.store_id,
                productName: d.product_name,
                qty: d.qty,
                date: d.date,
                notes: d.notes
            })),
            supplierInvoices: (invoicesData || []).map(i => ({
                id: i.id,
                supplierName: i.supplier_name,
                invoiceNumber: i.invoice_number,
                date: i.date,
                amount: Number(i.amount),
                notes: i.notes
            })),
            rawStock: (rawStockData || []).map(rs => ({
                id: rs.id,
                itemName: rs.item_name,
                qty: Number(rs.qty),
                unit: rs.unit,
                supplierName: rs.supplier_name
            })),
            productStock: (manufacturedStockData || []).map(ms => ({
                id: ms.id,
                modelCode: ms.model_code,
                colorCode: ms.color_code,
                qty: ms.qty
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
    },

    async saveDeposit(deposit: import('../types').Deposit) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            store_id: deposit.storeId,
            product_name: deposit.productName,
            qty: deposit.qty,
            date: deposit.date,
            notes: deposit.notes
        };

        if (deposit.id.length > 20) { // UUID
            const { error } = await supabase.from('deposits').update(payload).eq('id', deposit.id);
            if (error) throw error;
            return deposit.id;
        } else {
            const { data, error } = await supabase.from('deposits').insert([payload]).select().single();
            if (error) throw error;
            return data.id;
        }
    },

    async deleteDeposit(id: string) {
        const { error } = await supabase.from('deposits').delete().eq('id', id);
        if (error) throw error;
    },

    async saveSupplierInvoice(invoice: import('../types').SupplierInvoice) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            supplier_name: invoice.supplierName,
            invoice_number: invoice.invoiceNumber,
            date: invoice.date,
            amount: invoice.amount,
            notes: invoice.notes
        };

        if (invoice.id.length > 20) {
            const { error } = await supabase.from('supplier_invoices').update(payload).eq('id', invoice.id);
            if (error) throw error;
            return invoice.id;
        } else {
            const { data, error } = await supabase.from('supplier_invoices').insert([payload]).select().single();
            if (error) throw error;
            return data.id;
        }
    },

    async deleteSupplierInvoice(id: string) {
        const { error } = await supabase.from('supplier_invoices').delete().eq('id', id);
        if (error) throw error;
    },

    async saveRawStock(stock: import('../types').RawStock) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            item_name: stock.itemName,
            qty: stock.qty,
            unit: stock.unit,
            supplier_name: stock.supplierName
        };

        if (stock.id.length > 20) {
            const { error } = await supabase.from('raw_stock').update(payload).eq('id', stock.id);
            if (error) throw error;
            return stock.id;
        } else {
            const { data, error } = await supabase.from('raw_stock').insert([payload]).select().single();
            if (error) throw error;
            return data.id;
        }
    },

    async deleteRawStock(id: string) {
        const { error } = await supabase.from('raw_stock').delete().eq('id', id);
        if (error) throw error;
    },

    async saveProductStock(stock: import('../types').ProductStock) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            model_code: stock.modelCode,
            color_code: stock.colorCode,
            qty: stock.qty
        };

        const { error } = await supabase.from('manufactured_stock').upsert(payload, { onConflict: 'user_id,model_code,color_code' });
        if (error) throw error;
    },

    async deleteProductStock(id: string) {
        const { error } = await supabase.from('manufactured_stock').delete().eq('id', id);
        if (error) throw error;
    }
};
