import { ValidationSchema } from 'fastest-validator';

export type ApiGatewayIdentity = {
	sourceIp: string;
	userAgent: string;
}

export type ApiGatewayAuthorizer = {
	principalId?: string;
	integrationLatency?: string;
	janisAuth?: string;
};

export type UpperCaseRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type LowerCaseRequestMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type RawRequestEvent = {
	body: any;
	rawBody: string;
	method: UpperCaseRequestMethod;
	stage: string;
	headers: Record<string, string>;
	// query is not properly parsed for nested objects. For example: `{ 'filters[name]': 'comp', sortBy: 'name', sortDirection: 'asc' }`
	query: Record<string, string>;
	path: Record<string, string>;
	identity: ApiGatewayIdentity;
	authorizer: ApiGatewayAuthorizer;
	stageVariables: Record<string, string>;
	requestPath: string; // With leading slash and path variables between curly brackets
};

export type LowerCaseHeaders = Record<string, string>;

export type Cookies = Record<string, string>;

export type APIRequest<RequestData, PathParameters extends string[]> = {
	session: import('@janiscommerce/api-session').ApiSession;
	logId: string;
	data: RequestData;
	rawData: string;
	pristineData: RequestData;
	httpMethod: LowerCaseRequestMethod;
	endpoint: string;
	headers: LowerCaseHeaders;
	cookies: Cookies;
	pathParameters: string[];
	rawPathParameters: { [key in PathParameters[number]]: string };
};

type NotAny<T> = 0 extends (1 & T) ? never : T;

export type StrictValidationSchema<T> = T extends NotAny<T>
  ? ValidationSchema<T>
  : never;
