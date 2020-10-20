<template>
  <div>
    <button v-on:click="startMessage">Start</button>
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
        this.wsConnect()
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
        var u
        if(data.id != 0){
          switch (cmd) {
            case COMMAND_ADD_TEXT:
              url = `https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=6&per=4&text=` + encodeURI(data.authorName + "说:" + data.content)
              u = new Audio(url)
              u.src = url
              u.play()
              break
            case COMMAND_ADD_GIFT:
              url = `https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=6&per=4&text=` + encodeURI("感谢" + data.authorName + "送的" + data.num + "个" + data.giftName)
              u = new Audio(url)
              u.src = url
              u.play()
              break
          }
        }
      }
    }
  }
}
</script>