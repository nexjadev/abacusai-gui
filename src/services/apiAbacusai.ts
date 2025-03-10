import { ref } from "vue"

// Tipos auxiliares para mantener el código organizado
type InputParams = {
    llmName: string | null;
    forceRoutingType: null;
};

type Segment = {
    type: string;
    title?: string;
    counter: number;
    segment: string | {
        temp: boolean;
        type: string;
        title: null;
        segment: string;
        isSpinny: boolean;
        messageId: null;
        isGeneratingImage: boolean;
    };
    isSpinny?: boolean;
    isRouting?: boolean;
    messageId: string;
    isCollapsed?: boolean;
    isComplexSegment?: boolean;
};

type SearchResult = {
    score: null;
    answer: string;
    source: string;
    image_ids: null;
};

type SearchResults = {
    msg_id: number;
    results: SearchResult[];
    is_docstore_id: null;
};

type DocInfo = {
    size: number;
    docId: string;
    filename: string;
    metadata: Record<string, unknown>;
    mimeType: string;
    uploadedAt: string;
    documentUploadId: string;
};

export type HistoryMessage = {
    regenerateAttempt: number;
    inputParams: InputParams;
    role: 'USER' | 'BOT';
    timestamp: string;
    messageIndex: number;
    text: string;
    modelVersion: string;
    segments: Segment[];
    searchResults?: SearchResults;
    streamedData?: string;
    streamedSectionData?: any[];
    llmDisplayName?: string;
    llmBotIcon?: string;
    routedLlm?: string;
    docInfos?: DocInfo[];
};

// Tipo principal que combina las tres versiones
export type Conversation = {
    // Propiedades comunes en todas las versiones
    deploymentConversationId: string;
    name: string;
    deploymentId: string;
    createdAt: Date;
    externalApplicationId: string;
    conversationType: 'CHATLLM';
    metadata: {
        chatllmTeamsV2: boolean;
    };

    // Propiedades opcionales que varían según el caso
    lastEventCreatedAt?: string;
    hasHistory?: 0 | 1;
    unusedDocumentUploadIds?: string[];
    history?: HistoryMessage[] | [];
};

// Tipos específicos para cada caso de uso
export type CreateConversation = Omit<Conversation, 'lastEventCreatedAt' | 'hasHistory'> & {
    history: [];
};

export type HistoryConversation = Omit<Conversation, 'lastEventCreatedAt' | 'hasHistory'> & {
    unusedDocumentUploadIds: string[];
    history: HistoryMessage[];
};

export type ListConversation = Omit<Conversation, 'history' | 'unusedDocumentUploadIds'> & {
    lastEventCreatedAt: string;
    hasHistory: 0 | 1;
};

export type ListConversationResponse = {
    success: boolean;
    result: Conversation[];
    error?: string;
    errorType?: string;
};

export type ExternalApplication = {
    name: string;
    externalApplicationId: string;
    deploymentId: string;
    description: string;
    isAgent: number;
    predictionOverrides?: Record<string, any>;
    isSystemCreated: number;
    isCustomizable: boolean;
    isVisible: boolean;
    hasThinkingOption: boolean;
    status: string;
    isExpensive?: boolean;
}

export type ConversationMetadata = {
    chatllmTeamsV2: boolean
}

export type ExternalApplicationsResponse = {
    success: boolean;
    result?: ExternalApplication[];
    error?: string;
    errorType?: string;
}

export type DeploymentConversationListItem = {
    deploymentConversationId: string;
    name: string;
    deploymentId: string;
    createdAt: string;
    lastEventCreatedAt?: string;
    hasHistory: number;
    externalApplicationId: string;
    conversationType: string;
    metadata: ConversationMetadata;
}

export type ListDeploymentConversationsResponse = {
    success: boolean;
    result: DeploymentConversationListItem[];
}

const getApiUrl = (path: string) => `${'http://3.21.99.235:8000'}${path}`

const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)

export const useApi = () => {
    const error = ref(null)

    // List models
    const listModels = async (): Promise<ExternalApplicationsResponse> => {
        const response = await fetch(getApiUrl('/applications/list'), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return await response.json()
    }

    // List chats
    const listChats = async (deploymentId: string, limit: string): Promise<Conversation[]> => {
        const queryParams = new URLSearchParams({
            deploymentId,
            limit
        });
        const response = await fetch(getApiUrl('/conversations/list?' + queryParams.toString()), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        const listConversationResponse: ListConversationResponse = await response.json()
        if (!listConversationResponse.success) {
            throw new Error(listConversationResponse.error)
        }
        return listConversationResponse.result
    }

    return {
        error,
        listModels,
        listChats,
    }
}
