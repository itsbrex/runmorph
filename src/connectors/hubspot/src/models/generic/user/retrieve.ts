import { Generic }  from '@run-morph/models';
import { Retrieve, Resource, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot pipeline model
const metadata:Metadata<Generic.User> = {
	model: Generic.User,
	scopes: ['crm.objects.owners.read']
};


export default new Retrieve( async (runtime, { id }) => { 
	console.log(id)
	
	// Call the HubSpot API to GET a user 
	const response = await runtime.proxy({
		method: 'GET',
		path: `/crm/v3/owners/${id}`
	});

	
	console.log(response)
	// Handle errors from the API response
	if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }

	// Map resource for the response
	const resource = mapResource(response) 

	return resource

}, metadata );



// Helper function to map HubSpot owenr to Generic.User resource
function mapResource(hs_owner){
	return new Resource({ 
		id: hs_owner.id,
		data: {
			first_name: hs_owner.firstName,
			last_name: hs_owner.lastName,
			email: hs_owner.email
		},
		created_at: new Date(hs_owner.createdAt).toISOString(),
		updated_at: new Date(hs_owner.updatedAt).toISOString(),
		remote_data: hs_owner
	}, Generic.User)
}