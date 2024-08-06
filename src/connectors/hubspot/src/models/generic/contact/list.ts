import { Generic }  from '@run-morph/models';
import { List, Resource, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot Contact model
const metadata:Metadata<Generic.Contact> = {
	model: Generic.Contact,
	scopes: ['crm.objects.contacts.read']
};

// Export a new List operation
export default new List( async ( runtime, { page_size, cursor, sort, filter, remote_fields }) => { 

	// Initialize the request body with default values
	const body = {
		sorts: [],
		filterGroups:[],
		limit: 50, // Default limit
		properties: [
			'email', 'firstname', 'lastname', 'website', 'company', 'phone', 'address', 'city', 'state', 'zip', 'country', 'hubspot_owner_id', 'createdate', 'closedate', 'lastmodifieddate', 'lifecyclestage',
			...remote_fields
		],
		after: cursor?.after || null
	}

	// Adjust limit, sort, and filter based on input parameters
	const hs_limit = page_size > 50 || page_size === null ? 50 : page_size;
	const hs_sort = sort ? mapSort(sort) : null;
	const hs_filter = filter ? mapFilter(filter) : null;

	if(hs_limit){
		body.limit = hs_limit;
	}

	if(hs_sort){
		body.sorts.push(hs_sort)
	}

	if(hs_filter){
		body.filterGroups.push({ filters: hs_filter })
	}

	// Call the HubSpot contact search API
	const response = await runtime.proxy({
		method: 'POST',
		path: '/crm/v3/objects/contacts/search',
		body
	});

	console.log(response.results)
	

	// Handle errors from the API response
	if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }

	// Prepare the next cursor and map resources for the response
	const next = response?.paging?.next || null;
	const resources = response.results.map(mapResource);  

	// Return the resources and the next cursor for pagination
	return { 
		data:  resources, 
		next: next 
	};

}, metadata );


// Helper function to map HubSpot contacts to HubSpot Contact resources
function mapResource(hs_contact){
	return new Resource({ 
		id: hs_contact.id,
		data: {
			first_name: hs_contact.properties.firstname,
			last_name: hs_contact.properties.lastname,
			email: hs_contact.properties.email,
			phone: hs_contact.properties.phone
		},
			created_at: new Date(hs_contact.createdAt).toISOString(),
			updated_at: new Date(hs_contact.updatedAt).toISOString(),
			remote_data: hs_contact
		}, Generic.Contact)
}

// Helper function to map sorting parameters
function mapSort(sort) {
    switch (sort) {
        case List.Sort.CREATED_AT_ASC:
            return 'createdate';
        case List.Sort.CREATED_AT_DESC:
            return '-createdate';
        case List.Sort.UPDATED_AT_ASC:
            return 'lastmodifieddate';
        case List.Sort.UPDATED_AT_DESC:
            return '-lastmodifieddate';
        default:
            return '-createdate';
    }
}

// Helper function to map filtering parameters
function mapFilter(filter) {
    const filterMapping = {
        first_name: 'firstname',
        last_name: 'lastname',
        email: 'email'
    };

    let hs_filters = [];
    for (let key in filter) {
        if (filter.hasOwnProperty(key) && filterMapping[key]) {
            hs_filters.push({
                propertyName: filterMapping[key],
                operator: 'EQ',
                value: filter[key]
            });
        }
    }

    return hs_filters;
}