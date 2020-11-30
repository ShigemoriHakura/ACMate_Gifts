<template>
  <div id="app" class="vertical">
    <Gift />
  </div>
</template>

<script>
import Gift from './components/Gift.vue'

export default {
  name: 'App',
  components: {
    Gift
  }
}
</script>

<style>
html,
body,
#app {
  width: 400px;
  height: 400px;
  font-weight: 900;
}
</style>