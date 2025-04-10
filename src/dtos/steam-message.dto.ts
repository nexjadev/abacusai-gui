// Tipo para los segmentos de respuesta
export type ChatResponseSegment = {
    content: string;
    type: string;
    message_id: string;
    counter: number;
}

// Tipo para la respuesta final
export type ChatFinalResponse = {
    end: boolean;
    success: boolean;
    counter: number;
}

export type StreamMessage = ChatResponseSegment | ChatFinalResponse;