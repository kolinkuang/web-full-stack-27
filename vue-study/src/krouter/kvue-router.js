// 实现一个插件类
// Note 实现要点:
// 1.Vue 组件注册
// 2.Router 状态管理
// 3.响应式

let Vue

class KVueRouter {

    // 如何实现一个router？
    constructor(options) {
        this.$options = options

        // 1. 保存当前 hash 到 current
        // current 必须是响应式的数据
        // defineProperty 只能拦截数据，无法将其转为响应式（依赖收集的原生实现，原本后面还有一大坨）

        // this.current = '/'
        Vue.util.defineReactive(this, 'current', '/')

        // 2. 监听 hash 变化
        window.addEventListener('hashchange', this.onHashChange.bind(this))
    }

    onHashChange() {
        // 获取 # 后面的部分
        this.current = window.location.hash.slice(1)
        console.log(this.current)
    }

}

// 插件实现：install 会在 use 被调用时调用
KVueRouter.install = function (_Vue) {
    // 保存构造函数
    Vue = _Vue

    // this.$router
    // 挂在 Vue 原型上
    // 使用全局混入 Vue.mixin()，将 router 实例挂载过程延迟到 Vue 实例构建之后
    Vue.mixin({
        beforeCreate() {
            // this 指的是 组件实例
            if (this.$options.router) {
                Vue.prototype.$router = this.$options.router
            }
        }
    })

    // 实现两个全局组件：router-view/router-link
    Vue.component('router-link', {
        // 属性声明
        props: {
            to: {
                type: String,
                required: true
            }
        },
        // <a href="#/abc">abc</a>
        // vue 运行时不包含编译器，所以不能直接使用视图模板
        // template: '<a href="#/abc">abc</a>'
        // <router-link to="/abc">abc</router-link>
        render(h) {
            return h('a', {
                attrs: {href: '#' + this.to}
            }, this.$slots.default)
        }
    })

    Vue.component('router-view', {
        // <div>XXXX</div>
        // Note: render() 函数可以递归调用
        render(h) {
            console.log('router-view.render() is called');

            const current = this.$router.current

            let component = null

            // 获取匹配的路由
            const route = this.$router.$options.routes.find(
                route => route.path === current
            )

            // 设置路由中的组件选项并渲染
            if (route) {
                ({component} = route)
            }

            return h(component, 'router-view')
        }
    })

}


export default KVueRouter
