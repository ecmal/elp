import system from "@ecmal/runtime";
import * as React from "@ecmal/react/react";

export interface IndexPageProperties {
    title: string;
    script: string;
    bundle:boolean;
}

export class IndexPageComponent extends React.Component<IndexPageProperties> {
    static get(props:IndexPageProperties) {
        return <IndexPageComponent {...props}/>
    }
    public props: IndexPageProperties;
    render() {
        /*let dependencies = (id,deps={
            '@ecmal/runtime' : system
        })=>{
            let m = system.read(id);
            if(!deps[m.id]){
                deps[m.id] = m;
                if(Array.isArray(m.requires)&&m.requires.length){
                    m.requires.forEach(r=>{
                        dependencies(r,deps);
                    })
                }
            }
            return deps;
        }
        let map = dependencies('@vendor/project/client');
        let modules = Object.keys(map).map(m=>{
            let mod = map[m]
            return <script key={mod.id} dangerouslySetInnerHTML={{
                __html : mod.source+'\n'+'//# sourceURL=bundle://'+mod.id+'.js\n'
            }}/>;
        })*/
        let init,exec;
        if(this.props.bundle){
            init = <script src={`/app/v1/${this.props.script}.js?bundle=executable`} />
        }else{
            init = <script src={`/app/v1/@ecmal/runtime/index.js`} />
            exec = <script dangerouslySetInnerHTML={{
                __html : [
                    `System.import("${this.props.script}").then(`,
                    `    r=>{if(typeof r.main=='function'){r.main()}},`,
                    `    e=>console.error(e)`,
                    `)`,
                ].join('\n')
            }}/>
        }
        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                    {init}
                </head>
                <body>
                    <div id='root'>{this.props.title}</div>
                    {exec}
                </body>
            </html>
        );
    }
}
