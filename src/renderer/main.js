import 'font-awesome/css/font-awesome.min.css';

import sysPath from 'path';
import Vue from 'vue';
import Buefy from 'buefy';
import moment from 'moment';
import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.config.productionTip = false;

Vue.use(Buefy);

Vue.filter('duration', (str) => {
  const date = moment().startOf('day')
    .seconds(str);

  return date.format('H:mm:ss');
});

Vue.filter('basename', (path) => {
  try {
    return sysPath.basename(path);
  } catch (err) {
    return path;
  }
});

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app');
