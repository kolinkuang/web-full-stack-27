import Vue from 'vue'
import App from './App.vue'
import './plugins/element.js'
import router from './krouter'
import store from './kstore'

Vue.config.productionTip = false
// 事件总线
Vue.prototype.$bus = new Vue()

new Vue({
  // 添加到配置项中，为什么？
  // 示例挂载到这里，是为了插件安装时可以注册实例（在此处声明）
  router,
  store,
  render: h => h(App)
}).$mount('#app')

//TODO today:
// 实现 VueRouter 类
// -- 处理路由选项
// -- 监控 url 变化，hashChange
// -- 响应这个变化
// 实现 install 方法
// |-- $router 注册
// |-- 实现两个全局组件