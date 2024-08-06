import { Generic }  from "@run-morph/models";
import { Create, ResourceEvent, Metadata, Error }  from "@run-morph/sdk";

const metadata:Metadata<Generic.Contact> = {
    model: Generic.Contact,
	scopes:[
        'crm.objects.contacts.write',
        'crm.schemas.contacts.write'
    ]
};

export default new Create( async (runtime, { data, remote_fields}) => { 
	
    const response = await runtime.proxy({
        method: 'POST',
        path: '/crm/v3/objects/contacts',
        body:{
            properties: {
                email: data.email,
                firstname: data.first_name,
                lastname: data.last_name,
                phone: data.phone
            },
            ...remote_fields
        }
    });
    
    if(response.status === 'error'){
        switch (response.category){
            case 'CONFLICT':
                throw new Error(Error.Type.RESOURCE_ALREADY_EXIST, response.message);
            default:
                throw new Error(Error.Type.UNKNOWN_ERROR, response.message);
        }
    }
    
    if(response.id){
        const resource = new ResourceEvent({ 
            id: response.id,
            created_at: new Date(response.createdAt).toISOString(),
            updated_at: new Date(response.updatedAt).toISOString()
        }, Generic.Contact)  
       
        return resource;
    } else {
        throw new Error(Error.Type.UNKNOWN_ERROR);
    }

}, metadata);

/*
Phonenpm link 
WORK,HOME, MOBILE, CUSTOM -> Custom Label
Primary: true
{
    "method": "POST",
    "path": "/crm/v3/objects/contacts",
    "body": {

    "properties": 
        {
        "email": "one@test.com",
        "fax": "+33611111111",
        "hs_object_id": "5601",
        "hs_whatsapp_phone_number": "+33633333333",
        "lastmodifieddate": "2024-03-08T05:27:48.551Z",
        "mobilephone":  "+33644444444",
        "phone":  "+33655555555",
        "work_email": "work@test.com"
    }
    }
    {
    "id": "5751",
    "properties": {
        "createdate": "2024-03-08T05:44:55.010Z",
        "email": "one@test.com",
        "fax": "+33611111111",
        "hs_all_contact_vids": "5751",
        "hs_calculated_mobile_number": "+33644444444",
        "hs_calculated_phone_number": "+33655555555",
        "hs_calculated_phone_number_country_code": "FR",
        "hs_email_domain": "test.com",
        "hs_is_contact": "true",
        "hs_is_unworked": "true",
        "hs_lifecyclestage_lead_date": "2024-03-08T05:44:55.010Z",
        "hs_marketable_status": "false",
        "hs_marketable_until_renewal": "false",
        "hs_object_id": "5751",
        "hs_object_source": "INTEGRATION",
        "hs_object_source_id": "2329156",
        "hs_object_source_label": "INTEGRATION",
        "hs_pipeline": "contacts-lifecycle-pipeline",
        "hs_searchable_calculated_mobile_number": "644444444",
        "hs_searchable_calculated_phone_number": "655555555",
        "hs_whatsapp_phone_number": "+33633333333",
        "lastmodifieddate": "2024-03-08T05:44:55.010Z",
        "lifecyclestage": "lead",
        "mobilephone": "+33644444444",
        "phone": "+33655555555",
        "work_email": "work@test.com"
    },
    "createdAt": "2024-03-08T05:44:55.010Z",
    "updatedAt": "2024-03-08T05:44:55.010Z",
    "archived": false
}


*/