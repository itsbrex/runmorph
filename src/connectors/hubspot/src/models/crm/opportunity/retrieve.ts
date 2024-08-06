import { Crm, Generic }  from '@run-morph/models';
import { Retrieve, Resource, ResourceRef, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot deal model
const metadata:Metadata<Crm.Opportunity> = {
	model: Crm.Opportunity,
	scopes: ['crm.objects.deals.read']
};


export default new Retrieve( async (runtime, { id }) => { 

	// Call the HubSpotAPI GET a deal 
	const response = await runtime.proxy({
		method: 'GET',
		path: `/crm/v3/objects/deals/${id}`,
		params:{
			associations:['company', 'contact'],
			properties:['hubspot_owner_id','dealname','amount','deal_currency_code','pipeline','dealstage']
		}
	});

	// Handle errors from the API response
	if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }

	// Map resource for the response
	const resource = mapResource(response) 

	// Return the resources and the next cursor for pagination
	return resource

}, metadata );


// Helper function to map HubSpot deal to HubSpot Crm.Opportunty resource
function mapResource(hs_deal){
	return new Resource({ 
		id: hs_deal.id,
		data: {
			name: hs_deal.properties.dealname,
			amount: hs_deal.properties.amount,
			currency: hs_deal.properties.deal_currency_code,
			stage: new ResourceRef({ id: hs_deal.properties.dealstage, parents:{pipeline:hs_deal.properties.pipeline}}, Crm.Stage),
			// TO DELETE
			status: new ResourceRef({ id: hs_deal.properties.dealstage, parents:{pipeline:hs_deal.properties.pipeline}}, Crm.Stage),
			pipeline: new ResourceRef({ id: hs_deal.properties.pipeline}, Crm.Pipeline),
			owner: new ResourceRef({ id: hs_deal.properties.hubspot_owner_id}, Generic.User),
			contacts: hs_deal.associations?.contacts ? hs_deal.associations.contacts.results.filter((c) => (c.type === 'deal_to_contact')).map((hs_contact) => (new ResourceRef<Generic.Contact>({ id: hs_contact.id }, Generic.Contact))) : [],
			companies: hs_deal.associations?.companies ? hs_deal.associations.companies.results.filter((c) => (c.type === 'deal_to_company')).map((hs_company) => (new ResourceRef<Generic.Company>({ id: hs_company.id }, Generic.Company))) : []
		},
		created_at: new Date(hs_deal.createdAt).toISOString(),
		updated_at: new Date(hs_deal.updatedAt).toISOString(),
		remote_data: hs_deal
		}, Crm.Opportunity)
}