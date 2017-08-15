export class Error extends URIError {
    [k:string]:any;
    code:number;
    status:string;
    message:string;
    details:any;
    constructor(code:number,status:string,details?:any){
        super(`${code} ${status}`);
        this.code = code;
        this.status = status;
        this.details = details;
    }
}