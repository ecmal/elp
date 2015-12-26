export class FileSystem {
    private static fs = require('fs');
    private static path = require('path');
    static resolve(...paths:string[]):string{
        return this.path.resolve(...paths);
    }
    static relative(base:string,path:string):string{
        return this.path.relative(base,path);
    }
    static dirname(path:string):string{
        return this.path.dirname(path);
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
    static readDir(dir,recursive=false) {
        var items = this.fs.readdirSync(dir).map((s)=>{
            return this.path.resolve(dir,s);
        });
        var files=[],dirs=[];
        items.forEach((f)=>{
            if(this.fs.statSync(f).isDirectory()){
                dirs.push(f);
            }else{
                files.push(f);
            }
        });
        if(recursive) {
            dirs.forEach((d)=> {
                files = files.concat(this.readDir(d,recursive));
            });
        }
        return files;
    }
    static watchDir(path,cb:(e:string,f:string)=>void,recursive=true):any{
        return this.fs.watch(path,{ persistent: true, recursive },cb);
    }
    static createDir(path,recursive=false){
        if(recursive){
            var parts = this.path.normalize(path).split(this.path.sep);
            path = '';
            for (var i = 0; i < parts.length; i++) {
                path += parts[i] + this.path.sep;
                if (!this.fs.existsSync(path)) {
                    this.fs.mkdirSync(path, 0x1FD);
                }
            }
        }else {
            this.fs.mkdirSync(path);
        }
    }
    static writeFile(path:string,data:string){
        var dirname = this.dirname(path);
        if(!this.exists(dirname)){
            this.createDir(dirname,true);
        }
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