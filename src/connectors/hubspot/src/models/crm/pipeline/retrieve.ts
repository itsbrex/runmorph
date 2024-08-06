import { Crm, Generic }  from '@run-morph/models';
import { Retrieve, Resource, ResourceRef, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot pipeline model
const metadata:Metadata<Crm.Pipeline> = {
	model: Crm.Pipeline,
	scopes: []
};


export default new Retrieve( async (runtime, { id }) => { 
	console.log(id)
	
	// Call the HubSpot API to GET a pipeline 
	const response = await runtime.proxy({
		method: 'GET',
		path: `/crm/v3/pipelines/deals/${id}`
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
            return new Resource<Crm.Stage>({id: hs_stage.id, parents:{pipeline:hs_pipeline.id}, data:{ name:hs_stage.label, type: stageType }, created_at: hs_stage.createdAt, updated_at: hs_stage.updatedAt, remote_data: hs_stage},Crm.Stage);
        })
		},
		created_at: new Date(hs_pipeline.createdAt).toISOString(),
		updated_at: new Date(hs_pipeline.updatedAt).toISOString(),
		remote_data: hs_pipeline
	}, Crm.Pipeline)
}