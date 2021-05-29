/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number;
}


export interface JoinPoint {
  methodName: string;
  target: any;
  args: any[];
  proceed(...args: any[]): any;
}