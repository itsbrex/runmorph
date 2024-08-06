import { Crm }  from '@run-morph/models';
import { List, Resource, ResourceRef, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot Deal model
const metadata:Metadata<Crm.Opportunity> = {
	model: Crm.Opportunity,
	scopes: ['crm.objects.deals.read']	
};

// Export a new List operation
export default new List( async (runtime, { page_size, cursor, sort, filter }) => { 

	// Initialize the request body with default values
	const body = {
		sorts: [],
		filterGroups:[],
		limit: 50, // Default limit
		properties: [
			'amount', 'company','closedate', 'dealname', 'pipeline', 'dealstage', 'hubspot_owner_id', 'deal_currency_code'
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

	// Call the HubSpot deal search API
	const response = await runtime.proxy({
		method: 'POST',
		path: '/crm/v3/objects/deals/search',
		body
	});

	console.log(response.results[0])

	// Handle errors from the API response
	if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }

	// Prepare the next cursor and map resources for the response
	const next = response?.paging?.next || null;
	const resources = []; // Initialise un tableau vide pour les ressources
	for (const result of response.results) {
		const resource = await mapResource(result, runtime);
		resources.push(resource);
	}
	
	// Return the resources and the next cursor for pagination
	return { 
		data:  resources, 
		next: next 
	};

}, metadata );


// Helper function to map HubSpot deal to HubSpot Crm.Opportunty resource
async function  mapResource(hs_deal, runtime){

	return new Resource({ 
		id: hs_deal.id,
		data: {
			name: hs_deal.properties.dealname,
			description: hs_deal.properties.description, // Assuming 'description' is a valid property from HubSpot deal
			amount: parseFloat(hs_deal.properties.amount),
			currency: hs_deal.properties.deal_currency_code, // Assuming currency is not provided by HubSpot and defaulting to 'USD'
			win_probability: null, // Assuming 'win_probability' is not provided by HubSpot
			stage: new ResourceRef({ id: hs_deal.properties.dealstage, parents:{pipeline:hs_deal.properties.pipeline}}, Crm.Stage),
			// TO DELETE
			status: new ResourceRef({ id: hs_deal.properties.dealstage, parents:{pipeline:hs_deal.properties.pipeline}}, Crm.Stage), 
			pipeline: new ResourceRef({ id: hs_deal.properties.pipeline}, Crm.Pipeline),
			closed_at: hs_deal.properties.closedate ? new Date(hs_deal.properties.closedate).toISOString() : null,
			contacts:[],
			companies:[]
		},
		created_at: new Date(hs_deal.createdAt).toISOString(),
		updated_at: new Date(hs_deal.updatedAt).toISOString(),
		remote_data: hs_deal
	},
	Crm.Opportunity)
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
        name: 'dealname',
        amount: 'amount',
        stage: 'dealstage',
        closed_at: 'closedate'
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