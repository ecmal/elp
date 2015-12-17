export class FileSystem {
    private static fs = require('fs');
    private static path = require('path');

    static resolve(...paths){
        return this.path.resolve(...paths);
    }
    static exists(path){
        return this.fs.existsSync(path)
    }
    static stats(path){
        return this.fs.statSync(path);
    }
    static isDir(path){
        return this.exists(path) && this.stats(path).isDirectory();
    }
    static isFile(path){
        return this.exists(path) && this.stats(path).isFile();
    }
    static createDir(path){
        return this.fs.mkdirSync(path);
    }
    static writeFile(path:string,data:string){
        if(typeof data == 'string'){
            return this.fs.writeFileSync(path,data,'utf8');
        }else{
            return this.fs.writeFileSync(path,data,'binary');
        }
    }
    static writeJson(path:string,data:any){
        return this.writeFile(path,JSON.stringify(data,null,'  ')+'\n');
    }
    static readFile(path:string):Buffer {
        return this.fs.readFileSync(path);
    }
    static readJson(path:string):any {
        return JSON.parse(this.fs.readFileSync(path));
    }
}
export default FileSystem;