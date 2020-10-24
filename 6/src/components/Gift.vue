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
        <v-row>
          <v-col cols="12" md="4">
            <v-chip>弹幕监听状态: {{started.toString()}}</v-chip>
            <v-text-field v-model="drawText" label="抽奖文本"></v-text-field>
            <v-text-field v-model="drawAmount" type="number" label="抽奖个数"></v-text-field>
            <v-select v-model="drawText" :items="gifts" label="礼物" item-text="gift_name" item-value="gift_name"></v-select>
            <v-switch v-model="isGift" :label="`是否是礼物: ${isGift.toString()}`"></v-switch>
            <v-btn elevation="2" color="primary" @click="started = true">开始</v-btn>
            <v-btn elevation="2" color="error" @click="started = false">结束</v-btn>
            <v-btn elevation="2" @click="getResult">抽奖</v-btn>
            <v-btn elevation="2" @click="cleanTable">清除</v-btn>
          </v-col>
          <v-col cols="12" md="5">
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      发送者
                    </th>
                    <th class="text-left">
                      UID
                    </th>
                    <th class="text-left">
                      发送次数
                    </th>
                    <th class="text-left">
                      弹幕
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in danmaku" :key="item.name">
                    <td>{{ item.name }}</td>
                    <td>{{ item.id }}</td>
                    <td>{{ item.num }}</td>
                    <td>{{ item.danmaku }}</td>
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
                      中奖者
                    </th>
                    <th class="text-left">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in danmakuDrawed" :key="item.name">
                    <td>{{ item.name }}</td>
                    <td>{{ item.id }}</td>
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
const COMMAND_ADD_GIFT = 3

export default {
  name: 'Gift',
  data() {
    return {
      text: "",
      started: false,
      isGift: false,
      items: [],
      danmaku: [],
      gifts: [],
      drawText: "",
      drawAmount: 1,
      danmakuDrawed :[],
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
    getResult(){
      this.started = false
      this.danmakuDrawed = this.makeRandomArr(this.danmaku, this.drawAmount)
    },
    makeRandomArr(arrList, num){
      if(num > arrList.length){
        return;
      }  
      var tempArr = arrList.slice(0);
      var newArrList=[];    
      for(var i = 0; i < num; i++){
          var random = Math.floor(Math.random() * (tempArr.length));
          var arr = tempArr[random];
          tempArr.splice(random, 1);
          newArrList.push(arr);    
      }
      return newArrList;
    },
    cleanTable(){
      this.danmaku = []
      this.danmakuDrawed = []
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      const url1 = `https://acmate.loli.ren/api/gifts`
      var data = (await axios.get(url)).data
      var datagifts = (await axios.get(url1)).data
      this.gifts = datagifts.data
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
            if(!this.isGift && this.started && this.drawText === data.content){
              this.pushToDanmaku(data.authorName, 1, data.id, data.content)
            }
            break
          case COMMAND_ADD_GIFT:
            if(this.isGift && this.started && this.drawText === data.giftName){
              this.pushToDanmaku(data.authorName, data.num, data.id, data.giftName)
            }
            break
        }
      }
    },
    pushToDanmaku(name, num, id, danmaku){
      var added = false;
      for (let i = 0; i < this.danmaku.length; i++) {
        const element = this.danmaku[i];
        if(element.name === name){
          this.danmaku[i].num += num
          added = true
        }
      }
      if(!added){
        this.danmaku.push({
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