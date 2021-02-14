// 完成目标：
// -- 实现数据响应式
// -- 实现依赖收集与依赖通知
// -- 实现编译器与模板引擎

/**
 * MVVM 实例
 *  */
class MVue {

    constructor(options) {
        this.$el = options.el
        this.$data = options.data

        // 实现数据响应式
        this.observe(this.$data)
        this.proxy(this)

        // 实现编译器
        new Compiler(this.$el, this)
    }

    observe(obj) {
        if (typeof obj !== 'object') {
            return obj
        }

        new Observer(obj)
    }

    proxy(vm) {
        Object.keys(vm.$data).forEach(key =>
            Object.defineProperty(vm, key, {
                get() {
                    return vm.$data[key]
                },
                set(newVal) {
                    vm.$data[key] = newVal
                }
            }))
    }

}

/**
 * Observer 观察者
 * 1.负责对对象进行依赖收集
 * 2.负责定义对象的响应式
 * 3.观察者模式应用
 *  */
class Observer {

    constructor(value) {
        if (Array.isArray(value)) {
            this.traverseArray(value)
        } else {
            this.traverse(value)
        }
    }

    traverse(obj) {
        Object.keys(obj).forEach(key => this.defineReactive(obj, key, obj[key]))
    }

    traverseArray() {
        console.log('To be implemented')
    }

    defineReactive(obj, key, val) {
        // 每个 dep 实例通过闭包形成各自的封闭作用域
        const dep = new Dep()

        Object.defineProperty(obj, key, {
            get() {
                // 依赖收集
                Dep.target && dep.attach(Dep.target)
                return val
            },
            set(newVal) {
                if (newVal !== val) {
                    val = newVal
                    // 依赖通知
                    dep.notify()
                }
            }
        })
    }

}

/**
 * Dep 主题/被依赖实例/被订阅实例
 * 1.负责管理 Watcher
 * 2.只需保存 Watcher 列表，不需保存 key（属性名），
 * 因为对 Dep 的调用是通过闭包实现
 *  */
class Dep {

    constructor() {
        this.$watchers = []
    }

    attach(watcher) {
        this.$watchers.push(watcher)
    }

    notify() {
        this.$watchers.forEach(watcher => watcher.update())
    }

}

/**
 * Watcher 监听器（具体观察者）
 * 1.负责执行动态属性的响应式更新
 * 2.每个 Watcher 持有一个更新函数
 * 3.更新函数负责更新视图
 * 4.关键属性：fn, update()
 *  */
class Watcher {

    constructor(vm, key, fn) {
        this.vm = vm
        this.key = key
        this.fn = fn

        // 触发一次依赖收集
        Dep.target = this
        console.log('Triggering dependency collection:', this.vm[this.key])
        Dep.target = null
    }

    update() {
        this.fn.call(this.vm, this.vm[this.key])
    }

}

/**
 * Compiler 编译器
 * 1.解析指令
 * 2.初始化视图
 * 3.绑定每个 Watcher，订阅数据变化
 *  */
class Compiler {

    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)
        this.compile(this.$el)
    }

    compile(el) {
        el.childNodes.forEach(node => {
            if (node.nodeType === 1) {
                console.log('Compiling element:', node.nodeName)
                this.compileElement(node)
                if (node.childNodes.length > 0) {
                    this.compile(node)
                }
            } else if (this.isInterText(node)) {
                console.log('Compiling text:', node.textContent)
                this.compileInterText(node)
            } else {
                console.log('Unknown node:', node.nodeName);
            }
        })
    }

    compileElement(node) {
        const attrs = node.attributes
        Array.from(attrs).forEach(({name, value}) => {
            if (!this.isCustomAttribute(name)) {
                return
            }
            const directive = name.slice(2)
            this[directive] && this[directive](node, value)
        })
    }

    isCustomAttribute(attrName) {
        return attrName.startsWith('m-')
    }

    isInterText(node) {
        return node.nodeType === 3 && /{{(.*)}}/.test(node.textContent)
    }

    compileInterText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    text(node, exp) {
        this.update(node, exp, 'text')
    }

    html(node, exp) {
        this.update(node, exp, 'html')
    }

    update(node, key, dir) {
        console.log('calling', dir + 'Update()')
        const _fn = this[dir + 'Update']
        // 初始化视图
        _fn && _fn(node, this.$vm[key])
        // 更新视图；通过闭包实现；每个 watcher 都被绑定到 compiler
        new Watcher(this.$vm, key, val => _fn(node, val))
    }

    textUpdate(node, exp) {
        node.textContent = exp
    }

    htmlUpdate(node, exp) {
        node.innerHTML = exp
    }

}

window.Vue = MVue
