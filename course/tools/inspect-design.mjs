// Optional SVG output is a temporary geometry inspection, not a production asset.
import {writeFileSync} from 'node:fs';
import {projectDesignVolumes} from '../design-projection.js';
const {svg,report}=projectDesignVolumes();
if(process.argv[2])writeFileSync(process.argv[2],svg);
writeFileSync(new URL('../validation/design-model-geometry.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
