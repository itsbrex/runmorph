import { Crm }  from '@run-morph/models';
import { List, Resource, ResourceRef, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot deal pipeline model
const metadata:Metadata<Crm.Pipeline> = {
	model: Crm.Pipeline,
	scopes: ['crm.objects.deals.read']
};

export default new List( async (runtime, { page_size, cursor, sort, filter }) => { 

	// Initialize the request body with default values
	const body = {
		sorts: [],
		filterGroups:[],
		limit: 50, // Default limit
		after: cursor?.after || null
	}

	// Adjust limit, sort, and filter based on input parameters
	const hs_limit = page_size > 50 || page_size === null ? 50 : page_size;

	if(hs_limit){
		body.limit = hs_limit;
	}

	// Call the HubSpot deal search API
	const response = await runtime.proxy({
		method: 'GET',
		path: '/crm/v3/pipelines/deals',
		body
	});

	console.log(response.results[0].stages)

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


// Helper function to map HubSpot pipeline to Crm.Pipeline resource
function mapResource(hs_pipeline){
	return new Resource<Crm.Pipeline>({ 
		id: hs_pipeline.id,
		data: {
			name: hs_pipeline.label,
			stages: hs_pipeline.stages.map((hs_stage) => {
            let stageType;
            if (hs_stage.archived) {
                stageType = 'UNKNOWN';
            } else if (hs_stage.metadata.isClosed === "true") {
                stageType = hs_stage.metadata.probability === "1.0" ? 'WON' : 'LOST';
            } else {
                stageType = 'OPEN';
            }
            return new Resource<Crm.Stage>({id: hs_stage.id, parents:{pipeline:hs_pipeline.id}, data:{ name:hs_stage.label, type: stageType }, created_at: hs_stage.createdAt, updated_at: hs_stage.updatedAt, remote_data:hs_stage},Crm.Stage);
        })
		},
		created_at: new Date(hs_pipeline.createdAt).toISOString(),
		updated_at: new Date(hs_pipeline.updatedAt).toISOString(),
		remote_data: hs_pipeline
	}, Crm.Pipeline)
}