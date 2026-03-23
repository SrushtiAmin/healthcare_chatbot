import { LLMProvider } from './llm.service';
export interface RouteRequest {
    message: string;
    type: string;
    provider: LLMProvider;
    model: string;
    userId: string;
}
export interface RouteResponse {
    response: string;
    type: string;
    source: string;
    context?: string;
}
export declare class RouterModule {
    /**
     * Routes user queries based on classification and ensures responses are LLM-generated.
     */
    static routeQuery(request: RouteRequest): Promise<RouteResponse>;
}
//# sourceMappingURL=router.d.ts.map