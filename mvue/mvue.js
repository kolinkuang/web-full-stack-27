// 完成目标：
// -- 实现数据响应式
// -- 实现依赖收集与依赖通知
// -- 实现编译器与模板引擎

//TODO
// 实现 k-model 指令：
// 需要通过闭包缓存 k-model 的变量值

/**
 * MVVM 实例
 *  */
class MVue {

    constructor(options) {
        this.$el = options['el']
        this.$data = options.data
        this.$methods = options.methods

        // 实现数据响应式
        Observer.observe(this.$data)
        this.proxy(this)

        // 实现编译器
        new Compiler(this.$el, this)
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

    static $set(obj, key, val) {
        Observer.set(...arguments)
    }

}

/**
 * Observer 观察者
 * 1.负责数据响应化
 * 2.观察者模式应用
 * 3.每个 data object 对应一个 observer
 *  */
class Observer {

    constructor(value) {
        if (Array.isArray(value)) {
            this.observeArray(value)
        } else {
            this.walk(value)
        }
    }

    walk(obj) {
        Object.keys(obj).forEach(key => Observer.defineReactive(obj, key, obj[key]))
    }

    observeArray(items) {
        items.forEach(Observer.observe)
    }

    static observe(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return
        }

        new Observer(obj)
    }

    static defineReactive(obj, key, val) {
        // 解决嵌套对象问题
        Observer.observe(val)

        // 每个 dep 实例通过闭包形成各自的封闭作用域
        const dep = new Dep()

        Object.defineProperty(obj, key, {
            get() {
                // 依赖收集
                // Note: ES6 没有原生静态属性，所以用以下方式来模拟（虽然看上去挺奇怪）
                Dep.target && dep.collect(Dep.target)
                return val
            },
            set(newVal) {
                if (newVal === val) {
                    return
                }
                // 解决新值是对象的情况
                Observer.observe(newVal)
                val = newVal
                // 依赖通知
                dep.notifyUpdate()
            }
        })
    }

    static set(obj, key, val) {
        Observer.defineReactive(...arguments)
    }

}

/**
 * Dep 主题/被依赖实例/被订阅实例
 * 1.负责管理 Watcher 列表
 * 2.不需管理 key（属性名），因为对 Dep 的调用是通过闭包实现
 *  */
class Dep {

    constructor() {
        this.$watchers = []
    }

    collect(watcher) {
        this.$watchers.push(watcher)
    }

    notifyUpdate() {
        this.$watchers.forEach(watcher => watcher.update())
    }

}

/**
 * Watcher 监听器（具体观察者）
 * 1.负责对对象进行依赖收集
 * 2.负责执行动态属性的响应式更新
 * 3.每个 Watcher 持有一个更新函数
 * 4.更新函数负责更新视图
 * 5.关键属性：updateFn, update()
 *  */
class Watcher {

    constructor(vm, key, updateFn) {
        this.vm = vm
        this.key = key
        this.updateFn = updateFn

        // 触发一次依赖收集
        // Note: 这样实现会导致 Observer 跟 Watcher 耦合？
        Dep.target = this
        console.log('Triggering dependency collection:', this.vm[this.key])
        Dep.target = null
    }

    update() {
        this.updateFn.call(this.vm, this.vm[this.key])
    }

}

/**
 * Compiler 编译器
 * 1.编译模板，解析指令
 * 2.初始化视图
 * 3.绑定每个 Watcher，订阅数据变化
 *  */
class Compiler {

    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)
        if (this.$el) {
            this.compile(this.$el)
        }
    }

    compile(el) {
        el.childNodes.forEach(node => {
            if (this.isElement(node)) {
                console.log('Compiling element:', node.nodeName)
                this.compileElement(node)
                if (this.hasChildNodes(node)) {
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

    isElement(node) {
        return node.nodeType === 1
    }

    hasChildNodes(node) {
        return node.childNodes && node.childNodes.length > 0
    }

    compileElement(node) {
        const attrs = node.attributes
        Array.from(attrs).forEach(({name, value}) => {
            if (this.isDirective(name)) {
                const dir = name.slice(2)
                this[dir] && this[dir](node, value)
            }
            if (this.isEvent(name)) {
                // 事件处理
                // @click='onClick'
                const event = name.slice(1)
                this.eventHandler(node, value, event)
            } else {
                console.log('Unknown element')
            }
        })
    }

    isDirective(attrName) {
        return attrName.startsWith('m-')
    }

    isEvent(attrName) {
        return attrName.startsWith('@')
    }

    eventHandler(node, exp, event) {
        // methods: {onClick: function () {}}
        const fn = this.$vm.$methods && this.$vm.$methods[exp]
        node.addEventListener(event, fn.bind(this.$vm))
    }

    isInterText(node) {
        return node.nodeType === 3 && /{{(.*)}}/.test(node.textContent)
    }

    compileInterText(node) {
        this.update(node, RegExp.$1, 'text')
    }

    text(node, exp) {
        this.update(...arguments, 'text')
    }

    html(node, exp) {
        this.update(...arguments, 'html')
    }

    // k-model="XX"
    model(node, exp) {
        // update() 方法只完成赋值
        this.update(...arguments, 'model')

        // 事件监听
        node.addEventListener('input', event => this.$vm[exp] = event.target.value)
    }

    update(node, key, dir) {
        console.log('calling', dir + 'Update()')
        const fn = this[dir + 'Update']
        // 初始化视图
        fn && fn(node, this.$vm[key])
        // 更新视图；通过闭包实现；每个 watcher 都被绑定到 compiler
        new Watcher(this.$vm, key, val => fn(node, val))
    }

    textUpdate(node, val) {
        node.textContent = val
    }

    htmlUpdate(node, val) {
        node.innerHTML = val
    }

    modelUpdate(node, val) {
        // 飙到元素赋值
        node.value = val
    }

}

window.Vue = MVue
