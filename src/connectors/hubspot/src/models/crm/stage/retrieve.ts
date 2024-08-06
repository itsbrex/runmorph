import { Crm, Generic }  from '@run-morph/models';
import { Pipeline } from '@run-morph/models/dist/crm';
import { Retrieve, Resource, ResourceRef, Metadata, Error }  from '@run-morph/sdk';

// Define metadata for the HubSpot stage model
const metadata:Metadata<Crm.Stage> = {
	model: Crm.Stage,
	scopes: []
};

// Export a new List operation
export default new Retrieve( async (runtime, { id, parents }) => { 

	// Call the HubSpot API to GET pipeline stages 
	const response = await runtime.proxy({
		method: 'GET',
		path: `/crm/v3/pipelines/deals/${parents.pipeline}/stages/${id}`
	});

	// Handle errors from the API response
	if(response.status === 'error'){
        switch (response.category){
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }

	// Map resource for the response
	const resource = mapResource(response, parents.pipeline) 

	return resource

}, metadata );



// Helper function to map HubSpot pipeline stage
function mapResource(hs_stage, pipeline){

	let stageType;
	if (hs_stage.archived) {
		stageType = 'UNKNOWN';
	} else if (hs_stage.metadata.isClosed === "true") {
		stageType = hs_stage.metadata.probability === "1.0" ? 'WON' : 'LOST';
	} else {
		stageType = 'OPEN';
	}
	return new Resource<Crm.Stage>({
		id: hs_stage.id,
		parents:{
			pipeline:pipeline
		},
		data:{ 
			name:hs_stage.label, 
			type: stageType 
		}, 
		created_at: hs_stage.createdAt, 
		updated_at: hs_stage.updatedAt,
		remote_data: hs_stage
	}, Crm.Stage );
}