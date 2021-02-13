// Vue ==> Observer ==> (1-to-n, 依赖收集) ==> Dep ==> (1-to-n) ==> Watcher ==> update()
// Watcher: 只负责更新

function defineReactive(obj, key, val) {

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

    // 创建一个观察者用来观察
    new Observer(obj)
}

function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                // 转发
                return vm.$data[key]
            },

            set(val) {
                vm.$data[key] = val
            }
        })
    })
}

// Observer: 用来区分对象还是数组，从而做不同响应式操作
class Observer {
    constructor(value) {
        if (Array.isArray(value)) {
            // array:

        } else {
            // object
            this.walk(value)
        }
    }

    // 访问器模式
    walk(obj) {
        Object.keys(obj).forEach(key => {
            defineReactive(obj, key, obj[key])
        })
    }
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
        new Compile(options.el, this)
    }

}

class Compile {

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
            } else if (this.isInter(node)) {
                console.log('编译文本', node.textContent)
                this.compileText(node)
            } else {
                console.log('Unknown')
            }
        })
    }

    // 是否插值表达式 {{xx}}
    isInter(node) {
        return node.nodeType === 3 && /{{(.*)}}/.test(node.textContent)
    }

    // 编译元素
    compileElement(node) {
        // attrs
        const attrs = node.attributes
        Array.from(attrs).forEach(a => {
            // k-text
            const attrName = a.name  // k-text
            const exp = a.value      // counter
            if (attrName.startsWith('k-')) {
                const dir = attrName.substring(2)
                this[dir] && this[dir](node, exp)
            }

            // k-bind:title=""
            // :style :class

        })
    }

    // 处理插值
    compileText(node) {
        this.update(node, RegExp.$1, 'text')
        // node.textContent = this.$vm[RegExp.$1]
    }

    // k-text
    text(node, exp) {
        this.update(node, exp, 'text')
        // node.textContent = this.$vm[exp]
    }

    textUpdate(node, val) {
        node.textContent = val
    }

    // k-html
    html(node, exp) {
        this.update(node, exp, 'html')
        // node.innerHTML = this.$vm[exp]
    }

    htmlUpdate(node, val) {
        node.innerHTML = val
    }

    // 节点，表达式和指令
    update(node, key, dir) {
        // 0. 获取实操函数
        const fn = this[dir+'Update']

        // 1.init
        fn && fn(node, this.$vm[key])

        // 2.update, 使用了闭包
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
        this.fn.call(this.vm, this.vm[this.key])
    }

}

window.Vue = KVue
