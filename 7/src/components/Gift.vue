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
                  <tr v-for="item in danmaku" :key="item.id">
                    <td>{{ item.sender_name }}</td>
                    <td>{{ item.sender_num }}</td>
                    <td>{{ item.song }}</td>
                    <td>
                      <v-btn elevation="2" color="primary" @click="moveSong(item.song)">已唱</v-btn>
                      <v-btn elevation="2" color="primary" v-clipboard:copy="item.song" v-clipboard:success="onCopy">复制</v-btn>
                      <v-btn elevation="2" color="error" @click="deleteSong(item.song)">删除</v-btn>
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
                  <tr v-for="item in danmakuDoneSong" :key="item.id">
                    <td>{{ item.song }}</td>
                    <td>{{ item.sender_name }}</td>
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
    async fetchSongs(){
      const url = `https://acmate.loli.ren/api/song/?token=` + this.$route.params.token + "&action=show"
      var data = (await axios.get(url)).data
      if(data.data.length == 0){
        this.danmaku = []
        this.danmakuDoneSong = []
      }else{
        for (let i = 0; i < data.data.length; i++) {
          const element = data.data[i];
          let result = this.danmaku.find(c => Number(c.id) === element.id);
          if(result){
            if(result.done !== element.done){
              if(element.done == 0){
                //什么玩意？？？
              }else{
                this.danmaku.splice(result, 1)
              }
            }
          }else{
            if(element.done == 0){
              this.danmaku.push(element)
            }else{
              let result1 = this.danmakuDoneSong.find(c => Number(c.id) === element.id);
              if(!result1){
                this.danmakuDoneSong.push(element)
              }
            }
          }
        }
        for (let i = 0; i < this.danmaku.length; i++) {
          const element = this.danmaku[i];
          let result = data.data.find(c => Number(c.id) === element.id);
          if(!result){
            this.danmaku.splice(element, 1)
          }
        }
      }
    },
    onCopy: function () {
      this.copied = true
    },
    async cleanTable(){
      const url = `https://acmate.loli.ren/api/song/?token=` + this.$route.params.token + "&action=clear"
      var data = (await axios.get(url)).data
      if(data.result == true){
        this.$notify.toast("成功！")
      }else{
        this.$notify.toast("失败！")
      }
    },
    async moveSong(songName){
      const url = `https://acmate.loli.ren/api/song/?token=` + this.$route.params.token + "&action=done&song=" + songName
      var data = (await axios.get(url)).data
      if(data.result == true){
        this.$notify.toast("成功！")
      }else{
        this.$notify.toast("失败！")
      }
    },
    async deleteSong(songName){
      const url = `https://acmate.loli.ren/api/song/?token=` + this.$route.params.token + "&action=del&song=" + songName
      var data = (await axios.get(url)).data
      if(data.result == true){
        this.$notify.toast("成功！")
      }else{
        this.$notify.toast("失败！")
      }
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.text = data.data.text
        this.config.roomId = data.data.roomID
        this.wsConnect()
        window.setInterval(this.fetchSongs, 0.5 * 1000)
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
                var name = data.authorName.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, "");
                this.pushToDanmaku(name, data.id, keyword)
              }
            }
            break
        }
      }
    },
    async pushToDanmaku(name, id, song){
      const url = `https://acmate.loli.ren/api/song/?token=` + this.$route.params.token + "&action=add&song=" + song + "&sender=" + name + "&senderid=" + id
      var data = (await axios.get(url)).data
      if(data.result == true){
        this.$notify.toast("用户" + name + "点歌：" + song)
      }else{
        this.$notify.toast("失败！")
      }
    }
  }
}
</script>