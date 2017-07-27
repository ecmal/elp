export interface Require {
    (id: string): any;
    resolve(id:string):string;
}
declare const require:Require;
export const process: any = require('process');
export const url: any = require('url');
export const http: any = require('http');
export const https: any = require('https');
export const fs: any = require('fs');
export const path: any = require('path');
export const ts: any = require('typescript');
ts.path = require.resolve('typescript');