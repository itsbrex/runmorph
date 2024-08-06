import { Crm }  from '@run-morph/models';
import { Update, ResourceEvent, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot deal model
const metadata:Metadata<Crm.Opportunity> = {
	model: Crm.Opportunity,
	scopes: ['crm.objects.deals.write']
};


export default new Update( async (runtime, { id, data }) => { 

	let properties: { [key: string]: string | number } = {};

    if (data.name) properties.dealname = data.name;
    if (data.description) properties.description = data.description;
    if (data.amount) properties.amount = data.amount.toString();
    if (data.currency) properties.deal_currency_code = data.currency;
    if (data.win_probability) properties.custom_win_probability = data.win_probability.toString();
    if (data.stage && data.stage.id) properties.dealstage = data.stage.id;
    // TO DELETE
    if (data.status && data.status.id) properties.dealstage = data.status.id;
    if (data.pipeline && data.pipeline.id) properties.pipeline = data.pipeline.id;
    if (data.closed_at) properties.custom_closed_at = data.closed_at;
    if (data.owner && data.owner.id) properties.hubspot_owner_id = data.owner.id;

    // Map unified deal data to HubSpot API format
    const hubSpotBody = { properties }

    // Call the HubSpot API PATCH a deal 
    const response = await runtime.proxy({
        method: 'PATCH',
        path: `/crm/v3/objects/deals/${id}`,
        body: hubSpotBody
    });

    // Handle errors from the API response
    if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }
    
    if(response.id){
        const resource = new ResourceEvent({ 
            id: response.id,
            created_at: new Date(response.createdAt).toISOString(),
            updated_at: new Date(response.updatedAt).toISOString()
        }, Crm.Opportunity)  
       
        return resource;
    } else {
        throw new Error(Error.Type.UNKNOWN_ERROR);
    }

}, metadata );
