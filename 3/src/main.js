import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import TTS from './components/TTS.vue'

import zh from './lang/zh'
import en from './lang/en'

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(VueI18n)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/api/display/:token', name: 'room', component: TTS}
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
  i18n
}).$mount('#app')
