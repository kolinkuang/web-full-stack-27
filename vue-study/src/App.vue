<template>
  <div id="app">
    <div id="nav">
      <!-- 路由跳转连接 -->
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <!-- 路由出口 -->
    <!-- 利用vue响应式：current -->
    <!--  路由入口，利用数据响应式，实现自动重渲染  -->
    <router-view/>

    <p @click="$store.commit('add')">commit: {{$store.state.counter}}</p>
    <p @click="$store.dispatch('add')">dispatch: {{$store.state.counter}}</p>
    <p>doubleCounter: {{$store.getters.doubleCounter}}</p>
  </div>
</template>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
