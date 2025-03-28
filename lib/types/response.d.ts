export type RawResponsePayload = {
	clientCode?: string;
	statusCode: number;
	statusCodeForPatternMatching: string;
	headers?: Record<string, string>;
	body?: string;
};

export type ResponseCookieWithOptions = {
	value: string;
	httpOnly?: boolean;
	secure?: boolean;
	path?: string;
	expires?: Date;
	domain?: string;
}

export type APIResponse = {
	clientCode?: string;
	body: any;
	code?: number;
	headers: Record<string, string>;
	cookies?: Record<string, string|ResponseCookieWithOptions>;
}

export type JsonString<T> = string & { __jsonType?: T };
