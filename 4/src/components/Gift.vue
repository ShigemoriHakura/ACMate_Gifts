<template>
  <div id="countdown">  
    <div id='tiles' class="color-full">{{hour}}:{{minute}}:{{second}}</div>
    <div class="countdown-label" id="countText">直播倒计时！</div>
    <div class="countdown-label" id="posGift">一个{{ item.giftName }}加{{ item.target }}分钟</div>
  </div>
</template>

<script>
import axios from 'axios'

const COMMAND_HEARTBEAT = 0
const COMMAND_JOIN_ROOM = 1
const COMMAND_ADD_GIFT = 3

export default {
  name: 'Gift',
  data() {
    return {
      timestampEnd:0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      item: [],
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
    }
  },
  methods: {
    refreshTimer(){
      var lefttime = parseInt((this.timestampEnd - new Date().getTime()) / 1000)
      if(lefttime >= 0){
        var h = parseInt(lefttime / (60 * 60) % 24)
        var m = parseInt(lefttime / 60 % 60)
        var s = parseInt(lefttime % 60)
        h = this.addZero(h)
        m = this.addZero(m)
        s = this.addZero(s)
        this.hours = h
        this.minutes = m
        this.seconds = s
      }
    },
    addZero(i){
      return i < 10 ? "0" + i: i + "";
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.item = {
          'giftAvatarUrl': data.data.giftAvatarUrl,
          'giftName': data.data.giftName,
          'count': 0,
          'target': data.data.amount,
          'time': data.data.time
        }
        this.timestampEnd = new Date().getTime() + data.data.time * 1000 * 60 * 60
        this.config.roomId = data.data.roomID
        this.wsConnect()
        window.setInterval(this.refreshTimer, 1 * 1000)
      }
    },
    wsConnect() {
      const url = `wss://danmaku.loli.ren/chat`
      this.websocket = new WebSocket(url)
      this.websocket.onopen = this.onWsOpen
      this.websocket.onclose = this.onWsClose
      this.websocket.onmessage = this.onWsMessage
      this.heartbeatTimerId = window.setInterval(this.sendHeartbeat, 10 * 1000)
    },
    sendHeartbeat() {
      this.websocket.send(JSON.stringify({
        cmd: COMMAND_HEARTBEAT
      }))
    },
    onWsOpen() {
      this.retryCount = 0
      this.websocket.send(JSON.stringify({
        cmd: COMMAND_JOIN_ROOM,
        data: {
          roomId: parseInt(this.config.roomId),
          version: "9.9.9",
          config: {
            autoTranslate: false
          }
        }
      }))
    },
    onWsClose() {
      if (this.heartbeatTimerId) {
        window.clearInterval(this.heartbeatTimerId)
        this.heartbeatTimerId = null
      }
      if (this.isDestroying) {
        return
      }
      window.console.log(`掉线重连中${++this.retryCount}`)
      this.wsConnect()
    },
    onWsMessage(event) {
      let {cmd, data} = JSON.parse(event.data)
      switch (cmd) {
        case COMMAND_ADD_GIFT:
          if(data.giftName === this.item.giftName){
            this.timestampEnd += data.num * this.item.target * 60 * 1000
          }
          break
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