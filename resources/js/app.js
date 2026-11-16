import './bootstrap';
import '@fontsource-variable/archivo/wdth.css';

import Alpine from 'alpinejs';
import { registerIconDirective } from './ecoradar/icons';
import { createStore } from './ecoradar/store';
import { helpers } from './ecoradar/helpers';
import { registerComponents } from './ecoradar/components';

window.Alpine = Alpine;

registerIconDirective(Alpine);
Alpine.magic('u', () => helpers);
Alpine.store('eco', createStore());
registerComponents(Alpine);

Alpine.start();
