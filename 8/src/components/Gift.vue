<template>
  <v-container>
    <Snowf v-if='fxType == "snow"'
      :amount="50"
      :size="5"
      :speed="1.5"
      :wind="0"
      :opacity="0.8"
      :swing="1"
      :image="null"
      :zIndex="null"
      :resize="true"
      color="#fff"
    />
    <Snowf v-if='fxType == "sakura"'
      :amount="50"
      :size="5"
      :speed="1.5"
      :wind="0"
      :opacity="0.8"
      :swing="1"
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
      }
    },
  }
}
</script>