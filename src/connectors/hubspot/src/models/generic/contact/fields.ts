import { Generic }  from '@run-morph/models';
import { Fields,  RemoteField, Metadata, Runtime }  from '@run-morph/sdk';

const metadata: Metadata<Generic.Contact> = {
    model: Generic.Contact,
    scopes: ['crm.schemas.contacts.read'],
    fields: {
        first_name: {
            remote_keys: ['firstname'],
            operations: ['list', 'retrieve', 'create', 'update']
        },
        last_name: {
            remote_keys: ['lastname'],
            operations: ['list', 'retrieve', 'create', 'update']
        },
        email: {
            remote_keys: ['email'],
            operations: ['list', 'retrieve', 'create', 'update']
        },
        phone: {
            remote_keys: ['phone'],
            operations: ['list', 'retrieve', 'create', 'update']
        }
    }
};

// Create an instance of the Fields class for CrmOpportunityModel
export default new Fields(async (runtime: Runtime) => { 
    
	const response = await runtime.proxy({
		method: 'GET',
		path: '/crm/v3/properties/contacts'
	});

    return response.results.map((hs_field) => new RemoteField({
        remote_field_key: hs_field.name,
        label: hs_field.label, 
        operations: hs_field.modificationMetadata.readOnlyValue ? [ 'retrieve', 'list' ] : [ 'create', 'list', 'retrieve', 'update'], 
        value_type: hs_field.type === 'number' ? 'number' : 'text',
        read_path:['properties',...[hs_field.name]], 
        write_path:['properties',...[hs_field.name]]
    }))
}, metadata);