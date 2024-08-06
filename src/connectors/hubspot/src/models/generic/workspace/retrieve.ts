import { Generic }  from '@run-morph/models';
import { Retrieve, Resource, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot pipeline model
const metadata:Metadata<Generic.Workspace> = {
	model: Generic.Workspace,
	scopes: []
};

export default new Retrieve( async (runtime, { id }) => { 
	
	// Call the HubSpot API to GET a user 
	const response = await runtime.proxy({
		method: 'GET',
		path: `/account-info/v3/details`
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

	return resource

}, metadata );

// Helper function to map HubSpot owenr to Generic.User resource
function mapResource(hs_workspace){
	return new Resource({ 
		id: hs_workspace.portalId,
		data: {
			name: `HubSpot (${hs_workspace.portalId})`
		},
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		remote_data: hs_workspace
	}, Generic.Workspace)
}