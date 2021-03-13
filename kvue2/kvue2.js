function defineReactive(obj, key, val) {

    // 递归拆解对象属性
    observe(val)

    // 创建对应的 Dep 实例
    const dep = new Dep()

    Object.defineProperty(obj, key, {
        get() {
            // 依赖收集
            // 建立映射关系
            Dep.target && dep.addDep(Dep.target)
            // console.log('get', key)
            return val
        },
        set(newVal) {
            if (newVal !== val) {
                // 新设置的值有可能是对象
                observe(newVal)
                val = newVal
                // 通知变化, update()
                dep.notify()
            }
        }
    })

}

function observe(obj) {
    if (typeof obj !== 'object') {
        return obj
    }

    // 创建一个观察者用来观察对象，并创建数据响应式
    new Observer(obj)
}

function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                // 闭包，转发
                return vm.$data[key]
            },

            set(val) {
                vm.$data[key] = val
            }
        })
    })
}

// KVue
// 编译 + 监听属性
class KVue {

    constructor(options) {
        this.$options = options
        this.$data = options.data

        // 1.响应式
        observe(this.$data)

        // 1.5 属性代理到 KVue 实例上
        // 用户可以通过 Vue 实例直接访问 data 中的响应式数据
        proxy(this)

        // 2.挂载：传入宿主元素和 KVue 实例
        if (options.el) {
            this.$mount(options.el)
        }
    }

    // New Change: 增加一个 $mount()：获得子树并追加到宿主元素上
    $mount(el) {
        // 1. 获取宿主元素
        this.$el = document.querySelector(el)

        // 2. 定义组件更新函数
        const updateComponent = () => {
            // 从组件选项中获得 render()
            const {render} = this.$options
            const el = render.call(this)
            const parent = this.$el.parentElement
            parent.insertBefore(el, this.$el.nextSibling)
            parent.removeChild(this.$el)
            this.$el = el
        }

        // 3. 创建 watcher
        new Watcher(this, updateComponent)
    }

}

// New Change: Watcher 对应一个组件
class Watcher {

    constructor(vm, updateFn) {
        this.vm = vm
        this.getter = updateFn
        // 依赖收集触发
        this.get()
    }

    get() {
        Dep.target = this
        this.getter.call(this.vm)
        Dep.target = null
    }

    update() {
        this.get()
    }

}

class Dep {

    constructor() {
        // 存储管理所有的 watchers
        this.deps = new Set()
    }

    addDep(watcher) {
        this.deps.add(watcher)
    }

    notify() {
        this.deps.forEach(watcher => watcher.update())
    }

}

class Observer {

    constructor(value) {
        this.walk(value)
    }

    walk(obj) {
        Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]))
    }

}

window.Vue = KVue
