<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="6" sm="0" xs="0" class="d-none d-md-flex d-lg-flex">
            <v-simple-table style="width: 100%;">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      发送者
                    </th>
                    <th class="text-left">
                      歌名
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in danmaku" :key="item.id">
                    <td style="font-size: 18px !important;font-weight: 800;">{{ item.sender_name }}</td>
                    <td style="font-size: 18px !important;font-weight: 800;">{{ item.song }}</td>
                  </tr>
                  </tbody>
              </template>
            </v-simple-table>
          </v-col>
          <v-col cols="12" md="6" sm="12" xs="12">
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
                    <td style="font-size: 18px !important;font-weight: 800;">{{ item.song }}</td>
                    <td style="font-size: 18px !important;font-weight: 800;">{{ item.sender_name }}</td>
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

<style>
.theme--light.v-application{
  background-color: rgba(255, 255, 255, 0) !important; 
}

.theme--light.v-data-table {
  background-color: rgba(255, 255, 255, 0) !important; 
}

::-webkit-scrollbar {
  width: 0 !important;
}

::-webkit-scrollbar {
  width: 0 !important;height: 0;
}
</style>

<script>
import axios from 'axios'

export default {
  name: 'Gift',
  data() {
    return {
      danmaku: [],
      danmakuDoneSong :[],
    }
  },
  created() {
    this.processToken()
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
          if(element.done == 0){
            let result = this.danmaku.find(c => Number(c.id) === element.id)
            if(!result){
              this.danmaku.push(element)
            }else{
              result.sender_num = element.sender_num
            }
          }else{
            let result1 = this.danmakuDoneSong.find(c => Number(c.id) === element.id);
            if(!result1){
              this.danmakuDoneSong.push(element)
            }
          }
        }
        for (let i = 0; i < this.danmaku.length; i++) {
          const element = this.danmaku[i];
          let result = data.data.find(c => Number(c.id) === element.id);
          if(!result){
            this.danmaku.splice(i, 1)
          }else{
            if(result.done == 1){
              this.danmaku.splice(i, 1)
            }
          }
        }
        for (let i = 0; i < this.danmakuDoneSong.length; i++) {
          const element = this.danmakuDoneSong[i];
          let result = data.data.find(c => Number(c.id) === element.id);
          if(!result){
            this.danmakuDoneSong.splice(i, 1)
          }
        }
      }
    },
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.text = data.data.text
        window.setInterval(this.fetchSongs, 0.5 * 1000)
      }
    }
  }
}
</script>