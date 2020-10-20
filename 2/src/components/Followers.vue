<template>
  <div class="tasks">
    <div class="task" v-for="item in items" v-bind:key="item.giftName">
      <div class="progress warm"  >
        <div class="progress-name"> {{ item.giftName }}</div>
        <div class="progress-text" v-if="item.count <= item.target"> ({{ item.count }}/{{item.target}})</div>
        <div class="progress-text" v-else-if="finishedAction"> ({{ item.count }}/{{item.target}})</div>

        <div class="progress-text" v-else  > (已完成{{item.target}})</div>

        <div class="progress-bar" :style="item.barStyle" style="width: 0%"></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Followers',
  data() {
    return {
      items: [],
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
    async processToken(){
      const url = `https://acmate.loli.ren/api/query?token=` + this.$route.params.token
      var data = (await axios.get(url)).data
      if(data.result == 1){
        this.items.unshift({
          'giftName': "关注者",
          'count': 0,
          'target': data.data.amount
        })
        window.console.log(this.items)
        this.config.roomId = data.data.roomID
        window.setInterval(this.refreshFollowers, 1 * 1000)
      }
    },
    async refreshFollowers() {
      const url = `https://acmate.loli.ren/api/liveapi/` + this.config.roomId
      var data = (await axios.get(url)).data
      this.items[0].count = data.user.fanCountValue
    },
  }
}
</script>

<style>
html,body {
  width: 100%;
  height: 100%;
}

html {
  font-size: 16px;
}

body {
  backface-visibility: hidden;
  background-color: transparent;
  font-family: "Microsoft YaHei", "黑体", "宋体";
  overflow-y: hidden;
  overflow-x: hidden;
  margin: 0;
}

.tasks {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2em;
}

.vertical .tasks {
  justify-content: flex-start;
  flex-direction: column;
}

.task {
  margin: 0rem;
}

.vertical .task {
  margin: 0rem 0.5rem 0 0.5rem;
  display: flex;
  align-items: center;
}

.icon {
  height: 80px;
  weight: 80px;
  margin: 0.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.icon img {
  height: 6.4rem;
  width: 6.4rem;
  border-radius: 50% 50%;
}

.vertical .icon img {
  height: 5rem;
  width: 5rem;
  border-radius: 50% 50%;
}

.progress {
  font-size: 1rem;
  line-height: 1.5rem;
  position: relative;
  z-index: 5;
 
  //box-shadow: 0 0.3125rem 1.0625rem rgba(40, 40, 40, 0.5), 0 0 3px 1px rgba(40, 40, 40, 0.5) inset;
  height: 1.5rem;
 
  
}

.vertical .progress {
  font-size: 2rem;
  line-height: 2.5rem;
  border-radius: 1.25rem;
  height: 2.5rem;
  width: 24rem;
}
.progress-name {
  position: absolute;
  text-align: left;
  margin-left: 0.2em;
  z-index: 10;
  color: white;
  font-weight: 800;
  text-shadow: 0 0 0.0625rem #000, 0 0 0.125rem #000, 0 0 0.1875rem #000, 0 0 0.25rem #000, 0 0 0.3125rem #000;
  height: 100%;
  width: 100%;
}
.progress-text {
  position: absolute;
  text-align: right;
  z-index: 10;
  color: white;
  font-weight: 800;
  text-shadow: 0 0 0.0625rem #000, 0 0 0.125rem #000, 0 0 0.1875rem #000, 0 0 0.25rem #000, 0 0 0.3125rem #000;
  height: 100%;
  width: 100%;
}

.progress-bar {
  overflow: hidden;
  position: relative;
  border-radius: 1.25rem;
  transition: width .2s linear;
  height: 100%;
  width: 100%;
}
</style>
