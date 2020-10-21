<template>
  <div>
    <button v-on:click="startMessage" v-if="!play">Start</button>
    <p v-if="play">开始</p>
  </div>
</template>

<script>
import axios from 'axios'

const COMMAND_HEARTBEAT = 0
const COMMAND_JOIN_ROOM = 1
const COMMAND_ADD_TEXT = 2
const COMMAND_ADD_GIFT = 3

export default {
  name: 'TTS',
  data() {
    return {
      play: false,
      websocket: null,
      retryCount: 0,
      isDestroying: false,
      config: {},
      urlQueue: [],
    }
  },
  created() {
    this.processToken()
  },
  beforeDestroy() {
    this.isDestroying = true
    this.websocket.close()
  },
  methods: {
    startMessage(){
      this.play = true
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.config.roomId = data.data.roomID
        this.config.speed  = data.data.speed
        this.config.pitch  = data.data.pitch
        this.config.volume = data.data.volume
        this.config.person = data.data.person
        this.config.gift   = data.data.gift
        this.wsConnect()
        this.processQueue()
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
      if(this.play){
        let {cmd, data} = JSON.parse(event.data)
        var url
        if(data.id != 0){
          switch (cmd) {
            case COMMAND_ADD_TEXT:
              url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.config.speed + `&per=` + this.config.person + `&vol=` + this.config.volume + `&pit=` + this.config.pitch + `&tex=` + encodeURI(data.authorName + "说:" + data.content)
              this.urlQueue.push(url)
              break
            case COMMAND_ADD_GIFT:
              if(this.config.gift){
                url = `https://tts.baidu.com/text2audio?lan=ZH&cuid=baike&pdt=301&ctp=1&spd=` + this.config.speed + `&per=` + this.config.person + `&vol=` + this.config.volume + `&pit=` + this.config.pitch + `&tex=` + encodeURI("感谢" + data.authorName + "送的" + data.num + "个" + data.giftName)
                this.urlQueue.push(url)
              }
              break
          }
        }
      }
    },
    processQueue(){
      if(this.urlTimer != null){
        window.clearInterval(this.urlTimer);
      }
      if(this.urlQueue.length > 0){
        var url = this.urlQueue.splice(0, 1)
        var u = new Audio(url)
        u.src = url
        u.addEventListener('play',()=>{
            setTimeout(()=>{
              this.urlTimer = window.setInterval(this.processQueue, u.duration * 1000)
            }, 800)
        });
        u.play()
      }else{
        this.urlTimer = window.setInterval(this.processQueue, 0.5 * 1000)
      }
    }
  }
}
</script>