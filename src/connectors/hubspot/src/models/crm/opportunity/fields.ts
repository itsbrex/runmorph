import { Crm }  from '@run-morph/models';
import { Fields, RemoteField, Metadata, Runtime }  from '@run-morph/sdk';

const metadata: Metadata<Crm.Opportunity> = {
    model: Crm.Opportunity,
    scopes: ['crm.schemas.deals.read'],
    fields: {
        name: {
            remote_keys: ['dealname'],
            operations: ['list', 'retrieve']
        },
        description: {
            remote_keys: ['description'],
            operations: ['list', 'retrieve']
        },
        amount: {
            remote_keys: ['amount'],
            operations: ['list', 'retrieve']
        },
        currency: {
            remote_keys: ['deal_currency_code'],
            operations: ['list', 'retrieve']
        },
        win_probability: {
            remote_keys: [],
            operations: ['list', 'retrieve']
        },
        stage: {
            remote_keys: ['dealstage', 'pipeline'],
            operations: ['list', 'retrieve', 'update']
        },
        // TO DELETE
        status: {
            remote_keys: ['dealstage', 'pipeline'],
            operations: ['list', 'retrieve', 'update']
        },
        pipeline: {
            remote_keys: ['pipeline'],
            operations: ['list', 'retrieve']
        },
        closed_at: {
            remote_keys: ['closedate'],
            operations: ['list', 'retrieve']
        },
        contacts: {
            remote_keys: [],
            operations: ['retrieve']
        },
        companies: {
            remote_keys: [],
            operations: ['retrieve']
        }
    }
};

// Create an instance of the Fields class for CrmOpportunityModel
export default new Fields(async (runtime: Runtime) => { 
    
    const response = await runtime.proxy({
        method: 'GET',
        path: '/crm/v3/properties/deals'
    });

    return response.results.map((hs_field) => new RemoteField({
        // field
        remote_field_key: hs_field.name,
        // ask if need ot be sened for request in payload 
        // 🔴 might dissociate "id"/"key" from "field" (required to return attribute) and also "filter"
        label: hs_field.label, 
        // remove
        operations: hs_field.modificationMetadata.readOnlyValue ? ['retrieve', 'list'] : ['create', 'list', 'retrieve', 'update'], 
        value_type: hs_field.type === 'number' ? 'number' : 'text',
        // read (string only)
        read_path: ['properties', ...[hs_field.name]], 
        // write (string only)
        write_path: ['properties', ...[hs_field.name]]
        // filter
    }))
}, metadata);