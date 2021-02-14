// Vue instance ==> (1 data object to n sub objects)
// ==> Observer ==> (1 object to n attributes/keys, 依赖收集)
// ==> Dep ==> (1 key to n watcher)
// ==> Watcher ==> (1 watcher to 1 update()) => update()

// Observer 观察者：负责对对象进行依赖收集
// Dep：负责管理 watcher
// Watcher 监听器: 负责执行属性响应式更新

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
            // console.log('set', key)
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

function set(obj, key, val) {
    defineReactive(obj, key, val)
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

        // 2.编译：传入宿主元素和 KVue 实例
        new Compiler(options.el, this)
    }

}

// Observer: 用来区分对象还是数组，从而做不同响应式操作
// 持续监听所有属性
class Observer {

    constructor(value) {
        if (Array.isArray(value)) {
            // array
            this.walkArray(value)
        } else {
            // object
            this.walk(value)
        }
    }

    // 访问器模式
    walk(obj) {
        Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]))
    }

    walkArray(arr) {
        //TODO

    }

}

// 解析指令
class Compiler {

    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)

        // 执行编译
        this.compile(this.$el)
    }

    compile(el) {
        el.childNodes.forEach(node => {
            // element
            if (node.nodeType === 1) {
                // 遍历特性
                console.log('编译元素', node.nodeName)
                this.compileElement(node)

                // 递归
                if (node.childNodes.length > 0) {
                    this.compile(node)
                }
            } else if (this.isInterText(node)) {
                console.log('编译文本', node.textContent)
                this.compileInterText(node)
            } else {
                console.log('Unknown')
            }
        })
    }

    // 是否插值表达式 {{xx}}
    isInterText(node) {
        return node.nodeType === 3 && /{{(.*)}}/.test(node.textContent)
    }

    // 编译元素
    compileElement(node) {
        const attrs = node.attributes
        Array.from(attrs).forEach(a => {
            const attrName = a.name  // k-text
            const exp = a.value      // counter
            if (this.isCustomAttribute(attrName)) {
                const dir = attrName.slice(2)
                this[dir] && this[dir](node, exp)
            }

            // k-bind:title=""
            // :style :class
        })
    }

    isCustomAttribute(attrName) {
        return attrName.startsWith('k-')
    }

    // 处理插值
    compileInterText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    // k-text
    text(node, exp) {
        this.update(node, exp, 'text')
    }

    // k-html
    html(node, exp) {
        this.update(node, exp, 'html')
    }

    textUpdate(node, val) {
        node.textContent = val
    }

    htmlUpdate(node, val) {
        node.innerHTML = val
    }

    // 节点，表达式和指令
    update(node, key, dir) {
        // 0. 获取实操函数
        const fn = this[dir + 'Update']

        // 1.初始赋值
        fn && fn(node, this.$vm[key])

        // 2.更新监听, 使用闭包
        new Watcher(this.$vm, key, val => {
            fn && fn(node, val)
        })
    }

}

// 依赖收集
class Dep {

    constructor() {
        // 存储管理所有的 watchers
        this.watchers = []
    }

    addDep(watcher) {
        this.watchers.push(watcher)
    }

    notify() {
        this.watchers.forEach(watcher => watcher.update())
    }

}

// 界面中出现动态值，就要创建一个 watcher 实例
class Watcher {

    constructor(vm, key, fn) {
        this.vm = vm
        this.key = key
        this.fn = fn

        // 触发依赖收集：读取一次 key
        Dep.target = this // 保存当前实例
        this.vm[this.key] // 读取一次 key，触发 getter
        Dep.target = null
    }

    update() {
        this.updateFn.call(this.vm, this.vm[this.key])
    }

}

window.Vue = KVue
