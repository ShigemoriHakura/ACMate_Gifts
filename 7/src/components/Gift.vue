<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        {{text}}
      </div>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-dialog v-model="copied" width="500">

          <v-card>
            <v-card-title class="headline grey lighten-2">
              复制成功
            </v-card-title>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="copied = false">
                了解
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-row>
          <v-col cols="12" md="2">
            <v-chip>弹幕监听状态: {{getStatus}}</v-chip>
            <v-chip>发送弹幕格式: {{drawText}} 歌名</v-chip>
            <v-text-field v-model="drawText" label="点歌指令"></v-text-field>
            <v-btn elevation="2" color="primary" @click="started = true">开始</v-btn>
            <v-btn elevation="2" color="error" @click="started = false">结束</v-btn>
            <v-btn elevation="2" @click="cleanTable">清除</v-btn>
          </v-col>
          <v-col cols="12" md="7">
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      发送者
                    </th>
                    <th class="text-left">
                      发送次数
                    </th>
                    <th class="text-left">
                      歌名
                    </th>
                    <th class="text-left">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in danmaku" :key="item.iid">
                    <td>{{ item.name }}</td>
                    <td>{{ item.num }}</td>
                    <td>{{ item.danmaku }}</td>
                    <td>
                      <v-btn elevation="2" color="primary" @click="moveSong(item.danmaku)">已唱</v-btn>
                      <v-btn elevation="2" color="primary" v-clipboard:copy="item.danmaku" v-clipboard:success="onCopy">复制</v-btn>
                      <v-btn elevation="2" color="error" @click="deleteSong(item.danmaku)">删除</v-btn>
                    </td>
                  </tr>
                  </tbody>
              </template>
            </v-simple-table>
          </v-col>
          <v-col cols="12" md="3">
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      已唱歌曲
                    </th>
                    <th class="text-left">
                      点歌人
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in danmakuDoneSong" :key="item.iid">
                    <td>{{ item.danmaku }}</td>
                    <td>{{ item.name }}</td>
                  </tr>
                  </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import axios from 'axios'

const COMMAND_HEARTBEAT = 0
const COMMAND_JOIN_ROOM = 1
const COMMAND_ADD_TEXT = 2

export default {
  name: 'Gift',
  data() {
    return {
      copied :false,
      text: "",
      started: true,
      danmaku: [],
      drawText: "点歌",
      danmakuSongLength: 0,
      danmakuDoneSong :[],
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
  computed: {
    getStatus() {
      if(this.started){
        return "已开始"
      }
      return "已停止"
    }
  },
  methods: {
    onCopy: function () {
      this.copied = true
    },
    getResult(){
      this.started = false
      this.danmakuDrawed = this.makeRandomArr(this.danmaku, this.drawAmount)
    },
    cleanTable(){
      this.danmaku = []
      this.danmakuDrawed = []
    },
    moveSong(songName){
      for (let i = 0; i < this.danmaku.length; i++) {
        const element = this.danmaku[i];
        if(element.danmaku === songName){
          var arr = this.danmaku[i];
          this.danmaku.splice(i, 1)
          this.danmakuDoneSong.push(arr)
        }
      }
    },
    deleteSong(songName){
      for (let i = 0; i < this.danmaku.length; i++) {
        const element = this.danmaku[i];
        if(element.danmaku === songName){
          this.danmaku.splice(i, 1)
        }
      }
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.text = data.data.text
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
      let {cmd, data} = JSON.parse(event.data)
      if(data.id != 0){
        switch (cmd) {
          case COMMAND_ADD_TEXT:
            if(this.started){
              if (data.content.indexOf(this.drawText) === 0) {
                var keyword = data.content.split(" ").slice(1).join(" ");
                this.pushToDanmaku(data.authorName, 1, data.id, keyword)
              }
            }
            break
        }
      }
    },
    pushToDanmaku(name, num, id, danmaku){
      var added = false;
      for (let i = 0; i < this.danmaku.length; i++) {
        const element = this.danmaku[i];
        if(element.danmaku === danmaku){
          this.danmaku[i].num += num
          added = true
        }
      }
      if(!added){
        this.danmakuSongLength ++
        this.danmaku.push({
          "iid" : this.danmakuSongLength,
          "name" : name,
          "num" : num,
          "id" : id,
          "danmaku" : danmaku,
        })
      }
    }
  }
}
</script>