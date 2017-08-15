import {GoogleApi} from "@ecmal/gapi/api";

class GLogger {
    info(msg:string,data:any){}
    commit(){
        return new GLogger()
    }
    watch(stream?){
        return new GLogger()
    }
}

class GLoggingApi {
    log(log:string,labels:any){
        return new GLogger()
    }
}

class GApi {
    static async auth(options:{keyFile:string}){
        return new Promise<GApi>((a,r)=>{});
    }
    async metadata(options:{keyFile:string}){

    }
    async logging(options:{keyFile:string}){
        return new GLoggingApi()
    }
}


async function main(){
    let gapi = await GApi.auth({
        keyFile:'./someFile'
    });

    let meta = await gapi.metadata({
        keyFile:'./someFile'
    });
    let logging = await gapi.logging({
        keyFile:'./someFile'
    });
    let log = await logging.log('hello',{
        labels:{
            key:'value'
        }
    });
    log.watch();
    log.commit();
    log.info('message ${labels.one} ${labels.two}', {
        payload : {},
        labels : {
            key:'value'
        }
    });
}


