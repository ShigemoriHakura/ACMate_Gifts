<template>
  <div
    style="width: 100%;height: 100%; transform: scale(1) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) translate(200px, 200px);">
    <img class="alert-gift-img" :src="photo"
      style="height: 160px; position: absolute; transform: translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 96, 0, 1);"
      v-bind:style="classObject">
    <div class="alert-msg-text font-md shadow-soft"
      style="position: absolute; transform: translate(-50%, -50%) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, -16, 0, 1); "
      v-bind:style="classObject">
      <span>
        <span v-bind:style="fontObject" class="animated-letter wiggle" v-for="item in authorName"
          :key="item.key">{{item.content}}</span>
      </span>
      <span v-bind:style="fontObjectO"> 赠送了 </span>
      <span>
        <span v-bind:style="fontObject" class="animated-letter wiggle">{{giftNum}}</span>
      </span>
      <span v-bind:style="fontObjectO"> 个 </span>
      <span>
        <span v-bind:style="fontObject" class="animated-letter wiggle" v-for="item in giftName"
          :key="item.key">{{item.content}}</span>
      </span>
    </div>
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
      itemsQueue: [],

      websocket: null,
      retryCount: 0,
      isDestroying: false,
      config: {},

      authorName: [{ key: 0, content: "测" }, { key: 2, content: "试" }],
      giftNum: 0,
      giftName: [{ key: 0, content: "测" }, { key: 2, content: "试" }],
      left: 0,
      up: 0,
      location: "updown",
      show: false,
      opacity: 0,
      isNew: false,
      price: 1,
      fontColor: "7caeaa",
      ofontColor: "66CCFF",
      photo: "https://static.yximgs.com/bs2/giftCenter/giftCenter-20200316101317UbXssBoH.webp?imageView2/1/w/80/h/80",
    }
  },
  computed: {
    classObject: function () {
      var retArr = {}
      switch (this.location) {
        case "updown":
          retArr = {
            top: this.up + 'px',
            opacity: this.opacity
          }
          break
        case "rightleft":
          retArr = {
            left: this.left + 'px',
            opacity: this.opacity
          }
          break
      }
      return retArr
    },
    fontObject: function () {
      return {
        color: '#' + this.fontColor
      }
    },
    fontObjectO: function () {
      return {
        color: '#' + this.ofontColor
      }
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
    async processToken() {
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if (data.result == 1) {
        this.config.roomId = data.data.roomID
        this.location = data.data.way
        this.price = data.data.amount
        this.fontColor = data.data.fontColor
        this.ofontColor = data.data.ofontColor
        if (data.data.show == "gift") {
          this.show = true
        } else {
          this.show = false
        }
        this.wsConnect()
        this.procesItemQueueId = window.setInterval(this.procesItemQueue, 2.5 * 1000)
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
      let { cmd, data } = JSON.parse(event.data)
      switch (cmd) {
        case COMMAND_ADD_GIFT:
          this.itemsQueue.push(data)
          break
      }
    },
    procesItemQueue() {
      if (this.itemsQueue.length > 0) {
        var data = this.itemsQueue.splice(0, 1)
        if (data[0].totalCoin >= this.price) {
          switch (this.location) {
            case "updown":
              this.up = 50
              break
            case "rightleft":
              this.left = 50
              break
          }
          this.opacity = 0
          this.isNew = true
          if (this.show) {
            this.photo = data[0].webpPicUrl
          } else {
            this.photo = data[0].avatarUrl
          }
          this.giftName = this.getStrArray(data[0].giftName)
          this.giftNum = data[0].num
          this.authorName = this.getStrArray(data[0].authorName)
          setTimeout(this.fadeInOut, 50)
        }
      }
    },
    getStrArray(str) {
      var length = 0
      var arr = []
      while (length < str.length) {
        var strr = str[length]
        arr.push({ key: length, content: strr })
        length++
      }
      return arr
    },
    fadeInOut() {
      if (this.opacity < 1 && this.isNew) {
        this.opacity += 1 / 50
        this.changeLocation(false);
        setTimeout(this.fadeInOut, 20)
      } else if (this.opacity >= 1 && this.isNew) {
        this.isNew = false
        setTimeout(this.fadeInOut, 1500)
      } else if (this.opacity > 0 && !this.isNew) {
        this.opacity -= 1 / 50
        this.changeLocation(true);
        setTimeout(this.fadeInOut, 20)
      }
    },
    changeLocation(status) {
      switch (this.location) {
        case "updown":
          if (status) {
            this.up += 1
          } else {
            this.up -= 1
          }
          break
        case "rightleft":
          if (status) {
            this.left += 1
          } else {
            this.left -= 1
          }
          break
      }
    }
  }
}
</script>

<style>
body {
  height: 100%;
}

@keyframes wiggle {
  50% {
    transform: rotate(-4deg) scale(1.1);
  }
}

@-webkit-keyframes wiggle {
  50% {
    -webkit-transform: rotate(-4deg) scale(1.1);
  }
}

.wiggle {
  animation: wiggle 0.5s infinite;
  -webkit-animation: wiggle 0.5s infinite;
}
.animated-letter:nth-child(1) {
  animation-delay: 0ms;
}

.animated-letter {
  display: inline-block;
}

.wiggle {
  animation: wiggle 0.5s infinite;
  -webkit-animation: wiggle 0.5s infinite;
}

body {
  background: rgba(0, 0, 0, 0);
  font-size: 1.5rem;
  color: #fff;
  overflow: hidden;
  padding: 1.25rem;
}

.animated-letter {
  display: inline-block;
}
.animated-letter:nth-child(1) {
  animation-delay: 0ms;
}
.animated-letter:nth-child(2) {
  animation-delay: 0.1s;
}
.animated-letter:nth-child(3) {
  animation-delay: 0.2s;
}
.animated-letter:nth-child(4) {
  animation-delay: 0.3s;
}
.animated-letter:nth-child(5) {
  animation-delay: 0.4s;
}
.animated-letter:nth-child(6) {
  animation-delay: 0.5s;
}
.animated-letter:nth-child(7) {
  animation-delay: 0.6s;
}
.animated-letter:nth-child(8) {
  animation-delay: 0.7s;
}
.animated-letter:nth-child(9) {
  animation-delay: 0.8s;
}
.animated-letter:nth-child(10) {
  animation-delay: 0.9s;
}
.animated-letter:nth-child(11) {
  animation-delay: 1s;
}
.animated-letter:nth-child(12) {
  animation-delay: 1.1s;
}
.animated-letter:nth-child(13) {
  animation-delay: 1.2s;
}
.animated-letter:nth-child(14) {
  animation-delay: 1.3s;
}
.animated-letter:nth-child(15) {
  animation-delay: 1.4s;
}
.animated-letter:nth-child(16) {
  animation-delay: 1.5s;
}
.animated-letter:nth-child(17) {
  animation-delay: 1.6s;
}
.animated-letter:nth-child(18) {
  animation-delay: 1.7s;
}
.animated-letter:nth-child(19) {
  animation-delay: 1.8s;
}
.animated-letter:nth-child(20) {
  animation-delay: 1.9s;
}
.animated-letter:nth-child(21) {
  animation-delay: 2s;
}
.animated-letter:nth-child(22) {
  animation-delay: 2.1s;
}
.animated-letter:nth-child(23) {
  animation-delay: 2.2s;
}
.animated-letter:nth-child(24) {
  animation-delay: 2.3s;
}
.animated-letter:nth-child(25) {
  animation-delay: 2.4s;
}
.animated-letter:nth-child(26) {
  animation-delay: 2.5s;
}
.animated-letter:nth-child(27) {
  animation-delay: 2.6s;
}
.animated-letter:nth-child(28) {
  animation-delay: 2.7s;
}
.animated-letter:nth-child(29) {
  animation-delay: 2.8s;
}
.animated-letter:nth-child(30) {
  animation-delay: 2.9s;
}
</style>
