<template>
  <div id="countdown">  
    <div id='tiles' class="color-full">{{day}}:{{hour}}:{{minute}}:{{second}}</div>
    <div class="countdown-label" id="countText">{{text1}}</div>
    <div class="countdown-label" id="countText">{{text2}}</div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Gift',
  data() {
    return {
      timestampEnd:0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text1: "",
      text2: "",
      websocket: null,
      retryCount: 0,
      isDestroying: false,
      config: {},
    }
  },
  created() {
    this.processToken()
  },
  beforeDestroy() {
    this.isDestroying = true
    this.websocket.close()
  },
  watch: {
    second: {
      handler () {
      }
    },
    minute: {
      handler () {
      }
    },
    hour: {
      handler () {
      }
    },
    day: {
      handler () {
      }
    }
  },
  computed: {
    second() {
      return this.seconds
    },
    minute() {
      return this.minutes
    },
    hour() {
      return this.hours
    },
    day() {
      return this.days
    }
  },
  methods: {
    refreshTimer(){
      var lefttime = parseInt((this.timestampEnd - new Date().getTime()) / 1000)
      if(lefttime >= 0){
        var d = parseInt(lefttime / (24 * 60 * 60 ))
        var h = parseInt(lefttime / (60 * 60) % 24)
        var m = parseInt(lefttime / 60 % 60)
        var s = parseInt(lefttime % 60)
        h = this.addZero(h)
        m = this.addZero(m)
        s = this.addZero(s)
        d = this.addZero(d)
        this.hours = h
        this.minutes = m
        this.seconds = s
        this.days = d
      }
    },
    addZero(i){
      return i < 10 ? "0" + i: i + "";
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.text1 = data.data.liveText1
        this.text2 = data.data.liveText2
        this.timestampEnd = new Date().getTime() + data.data.liveTime * 1000 * 60 * 60
        window.setInterval(this.refreshTimer, 1 * 1000)
      }
    }
  }
}
</script>

<style type="text/css">
      
:root{
  --textColor:#c06;
}

body{ 
    font: normal 26px/26px Arial, Helvetica, sans-serif; 
    word-wrap:break-word;
    background: transparent;
    padding-top: 2em;
}

.countdown-label {
   
 
    text-align: center;
    
    display: block;
    color: #000000;
    
    margin-top: 0.3em;
}
#countdown{
  box-shadow: 0 1px 2px 0 rgba(1, 1, 1, 0.4);
  width: 300px;
  height: 145px;
  text-align: center;
  background: #f1f1f1;

  border-radius: 5px;

  margin: auto;
}



#countdown #tiles{
  color: #fff;
  position: relative;
  z-index: 1;
  text-shadow: 1px 1px 0px #ccc;
  display: inline-block;
  font-family: Arial, sans-serif;
  text-align: center;
  
  padding: 20px;
  border-radius: 5px 5px 0 0;
  font-size: 48px;
  font-weight: thin;
  display: block;
    
}

.color-full {
  background: #53bb74;
}
.color-half {
  background: #ebc85d;
}
.color-empty {
  background: #e5554e;
}

#countdown #tiles > span{
    width: 70px;
    max-width: 70px;

    padding: 18px 0;
    position: relative;
}





#countdown .labels{
    width: 100%;
 
    text-align: center;
    position: absolute;
  
}

#countdown .labels li{
   
    color: #f47321;
    text-shadow: 1px 1px 0px #000;
    text-align: center;
    text-transform: uppercase;
    display: inline-block;
}
</style>