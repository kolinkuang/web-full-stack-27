// TODO:
// 1.实现插件，用于挂载 $store
// 2.实现类 Store
// -- 维持响应式 state
// -- 实现 commit()
// -- 实现 dispatch()
// -- 实现 getters


// 创建 Store 类
// 保存用户选项
// 对 state 做响应式处理
// 提供可预测变更方法 commit
// 复杂业务和异步操作使用 dispatch

let Vue

class Store {

    constructor(options) {
        // 保存配置
        this.$options = options
        this._wrappedGetters = options.getters
        this._mutations = options.mutations
        this._actions = options.actions

        // 定义 computed 选项
        const computed = {}
        this.getters = {}
        const store = this
        // {doubleCounter(state){}}
        Object.keys(this._wrappedGetters).forEach(key => {
            // 获取用户定义的 getter
            const fn = store._wrappedGetters[key]
            // 转换为 computed 可使用的无参数形式
            // 装饰器模式
            // 关键语句！！！（使用了闭包）
            computed[key] = () => {
                return fn(store.state)
            }
            // 为 getters 代理只读属性，并通过缓存延迟响应
            Object.defineProperty(store.getters, key, {
                get: computed[key]
            })
        })

        // 对 state 做响应式处理
        // Vue 初始化的时候：
        // 1.会对 data 做响应式处理；
        // 2.data 中响应式属性会被代理到 Vue 实例上
        this._vm = new Vue({
            data: {
                // 加上两个$，就不会被代理
                $$state: options.state,
                // $$getters: this._defineGetters(options.getters)
                hello_world: '45464646464646464'
            }
        })

        this.commit = this.commit.bind(this)
        this.dispatch = this.dispatch.bind(this)
    }


    // 实现封装
    get state() {
        return this._vm._data.$$state
    }

    set state(v) {
        console.error('请使用 replaceState() 重置状态')
    }

    // 实现提交变更方法 commit
    // commit(type, payload)
    commit(type, payload) {
        // 获取 type 在 mutations 选项中对应的函数
        // 并调用该函数
        // Note: 策略模式应用
        const fn = this._mutations[type]
        if (!fn) {
            console.error('mutation not exist')
            return
        }

        fn(this.state, payload)
    }


    dispatch(type, payload) {
        const fn = this._actions[type]
        if (!fn) {
            console.error('action not exist')
            return
        }

        fn(this, payload)
    }

}

function install(_Vue) {
    Vue = _Vue
    //  挂 $store，保存 store 实例
    Vue.mixin({
        beforeCreate() {
            if (this.$options.store) {
                Vue.prototype.$store = this.$options.store
            }
        }
    })
}

export default {Store, install}
