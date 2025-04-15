export interface DocumentResponse {
    id: string;
    user_id: string;
    conversation_id: string | null
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    created_at: Date;
}

export interface AttachDocumentsRequest {
    conversation_id: string;
    document_ids: string[];
}


export type DetachDocumentsRequest = {
    conversation_id: string;
    document_ids: string[];
}
