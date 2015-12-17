import './cmd/init';
import './cmd/install';
// remove me
import './cmd/test';

import cli from './cmd/command';
import config from './config';
import services from './services';

config.load().then(config=>{
    return services.load(config).then(()=>{
        return cli('espm','1.0.0');
    })
}).catch(e=>console.error(e.stack));


