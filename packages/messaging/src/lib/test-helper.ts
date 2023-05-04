import {APIGatewayProxyEvent, Context} from "aws-lambda";

export const apiCommand = <P>(payload: P): Omit<APIGatewayProxyEvent, 'body' | 'pathParameters' | 'queryStringParameters'> & {body: P, pathParameters: null, queryStringParameters: null} => {
  return {
    body: payload
  } as any;
}

export const apiQuery = <P>(payload: P): Omit<APIGatewayProxyEvent, 'body' | 'pathParameters' | 'queryStringParameters'> & {queryStringParameters: P, body: null, pathParameters: null} => {
  return {
    queryStringParameters: payload
  } as any;
}

export const apiContext = <T>(context?: Partial<T>): Context & T => {
  if(!context) {
    context = {}
  }

  return {
    user: {id: 'a52ce474-8225-4628-ba09-5a82e41a6c34'},
    ...context
  } as any;
}
