<template>
  <v-container>
    <Snowf v-if='fxType == "snow"'
      :amount="amount"
      :size="size"
      :speed="speed"
      :wind="wind"
      :opacity="opacity"
      :swing="swing"
      :image="null"
      :zIndex="null"
      :resize="true"
      color="#fff"
    />
    <Snowf v-if='fxType == "sakura"'
      :amount="amount"
      :size="size"
      :speed="speed"
      :wind="wind"
      :opacity="opacity"
      :swing="swing"
      :image="require('../../public/static/img/sakura.png')"
      :zIndex="null"
      :resize="true"
      color="#fff"
    />
  </v-container>
</template>

<script>
import axios from 'axios'
import Snowf from 'vue-snowf';

export default {
  name: 'Gift',
  components: {
    Snowf
  },
  data() {
    return {
      fxType:"",
      speed: 1.5,
      swing: 1,
      wind: 0,
      size: 5,
      opacity: 0.8,
      amount: 50,
    }
  },
  created() {
    this.processToken()
  },
  computed: {
  },
  methods: {
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.fxType = data.data.fx
        this.speed = parseFloat(data.data.speed)
        this.swing = parseFloat(data.data.swing)
        this.wind = parseFloat(data.data.wind)
        this.size = parseFloat(data.data.size)
        this.opacity = parseFloat(data.data.opacity)
        this.amount = parseFloat(data.data.amount)
      }
    },
  }
}
</script>