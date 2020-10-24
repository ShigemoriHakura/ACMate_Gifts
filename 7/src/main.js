import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import vuetify from './plugins/vuetify';
import VueClipboard from 'vue-clipboard2'
import Gift from './components/Gift.vue'

import zh from './lang/zh'
import en from './lang/en'

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(VueI18n)
VueClipboard.config.autoSetContainer = true 
Vue.use(VueClipboard)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/:token', name: 'room', component: Gift},
    {path: '/api/display/:token', name: 'room', component: Gift}
  ]
})

let locale = window.localStorage.lang
if (!locale) {
  let lang = navigator.language
  if (lang.startsWith('zh')) {
    locale = 'zh'
  } else {
    locale = 'en'
  }
}
const i18n = new VueI18n({
  locale,
  fallbackLocale: 'en',
  messages: {
    zh, en
  }
})

new Vue({
  render: h => h(App),
  router,
  i18n,
  vuetify
}).$mount('#app')