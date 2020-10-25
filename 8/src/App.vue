<template>
  <Gift/>
</template>

<style>
::-webkit-scrollbar {
  width: 0 !important;
}
::-webkit-scrollbar {
  width: 0 !important;height: 0;
}
</style>

<script>
import Gift from './components/Gift';

export default {
  name: 'App',

  components: {
    Gift,
  },

  data: () => ({
    //
  }),
};
</script>
