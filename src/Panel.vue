<template>
    <section id="panel"
        v-on:scroll.prevent="handleScroll"
        :style="{ 'max-height': computedPanelMaxHeight }"
      >
      <div id="handle"></div>

      <h1>Générateur de <span style="color: lightsalmon;">balade</span></h1>
      
      <div class="cat">
        <h3><span style="color: lightsalmon; font-weight: 700;">D</span>urée : {{dispExpectedTime}}</h3>
        <Slider id="slider" ref="slider" v-bind:min="0.25" v-bind:max="6" v-bind:step="0.25" v-bind:value="0.5"/>

        <h3><span style="color: lightsalmon; font-weight: 700;">M</span>ode de déplacement</h3>
        <div id="modes">
          <div :class="mode"
            v-for="mode in modes"
              :key="mode.id"
              v-on:click="selectMode($event, mode)">
            <img :src="require('./img/' + mode.image)" />
            <div class="tooltip">{{mode.speed}} km/h</div>
          </div>
        </div>
        <h3><span style="color: lightsalmon; font-weight: 700;">Clique</span> sur la carte pour définir le point de départ</h3>
      </div>

      <div class="cat">
        <h3>Détails de la balade</h3>
        <div id="details">
          <div v-html='details'></div>
        </div>
      </div>
    </section>
</template>

<script>

import Slider from './Slider.vue'

const hourStr = function (time) {
  const hh = Math.floor(time)
  let min = Math.floor((time - Math.floor(time)) * 60)
  if (hh === 0) return min + 'min'
  if (min === 0) min = ''
  return hh + 'h' + min
}

export default {
  name: 'Panel',
  components: {
    Slider
  },
  data () {
    return {
      modes: [{
        id: 'grandma_dog',
        image: 'grandma_dog.jpg',
        speed: 1, // km/h
        mode: 'foot-walking',
        selected: false
      }, {
        id: 'dujardin_peignoir',
        image: 'dujardin_peignoir.jpg',
        speed: 2,
        mode: 'foot-walking',
        selected: false
      }, {
        id: 'poussette',
        image: 'poussette.jpg',
        speed: 3,
        mode: 'wheelchair',
        selected: false
      }, {
        id: 'marche-urbaine',
        image: 'marche-urbaine.jpg',
        speed: 4.2,
        mode: 'foot-walking',
        selected: true
      }, {
        id: 'marche-nordique',
        image: 'marche-nordique.jpg',
        speed: 7,
        mode: 'foot-hiking',
        selected: false
      }, {
        id: 'running_dog',
        image: 'running_dog.png',
        speed: 10,
        mode: 'foot-hiking',
        selected: false
      }],
      speed: 4.2,
      mode: 'foot-walking',
      km: 0,
      slider: null,
      scrollPosition: 0,
      windowWidth: 0,
      mobilePanelMaxHeight: 300
    }
  },
  created() {
    var self = this
    window.addEventListener('resize', function() {
      self.windowWidth = window.innerWidth
    })
  },
  mounted () {
    this.slider = this.$refs.slider
  },
  computed: {
    details: function () {
      const km = Number(this.km).toFixed(1)
      return 'Distance : ' + km + ' km' +
          '<br/>Temps : ' + hourStr(this.km / this.speed)
    },
    dispExpectedTime: function () {
      if (this.slider !== null) {
        const time = this.slider.currentValue
        return hourStr(time)
      } else {
        return ''
      }
    },
    computedPanelMaxHeight() {
      var value = ''
      if(this.windowWidth < 641)
        value = this.mobilePanelMaxHeight + 'px'
      else
        value = '100vh'
      console.log('computedPanelMaxHeight=' + value)
      return value
    }
  },
  methods: {
    selectMode(e, mode) {
      console.log('select mode ' + mode.id)
      for (var m in this.modes) {
        const mod = this.modes[m]
        if (mod === mode) {
          mod.selected = true
          this.speed = mod.speed
          this.mode = mod.mode
        } else {
          mod.selected = false
        }
      }
    },
    getExpectedTime () {
      return this.slider.currentValue
    },
    handleScroll(e) {
      var currentScrollPosition = e.srcElement.scrollTop
      //console.log(e.srcElement)
      var diff = currentScrollPosition - this.scrollPosition
      this.mobilePanelMaxHeight += diff
      //e.srcElement.scrollTop = 0
      this.scrollPosition = currentScrollPosition
    }
  }
}

</script>

<style scoped>

#panel {
  z-index: 1005;
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: auto;
  background-color: #000012bb;
  text-align: center;
  padding: 5px;
  box-shadow: 0px -1px 6px 0px rgba(0,0,0,0.75);
  overflow-y: auto;
}

#handle {
  position: relative;
  margin: auto;
  margin-bottom: 10px;
  width: 60px;
  height: 5px;
  background-color: #888;
  border-radius: 10px;
  cursor: move;
  visibility: visible;
}

@media only screen and (min-width: 641px) {
  #panel {
    left: 0px;
    top: 0px;
    width: 300px;
  }

  #handle {
    visibility: hidden;
  }
}

h1 {
  font-size: 3em;
  padding: 0px;
  margin: 5px;
}

h3 {
  font-size: 1.2em;
  font-weight: 100;
  padding: 2px;
  margin: 4px;
  margin-top: 5px;
}

.cat {
  background-color: #aaaaaa33;
  border-radius: 10px;
  padding: 5px;
  margin: 5px 5px 10px 5px;
}

#slider {
  position: relative;
  top: 0px;
  width: 50%;
  margin: auto;
  margin-bottom: 15px;
}

#modes {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  margin: 0px auto;
  position: relative;
  text-align: center;
}

.mode {
  width: 80px;
  height: 80px;
  margin: 4px;
  padding: 0px;
  cursor: pointer;
  background-color: lightsalmon;
  border: 5px solid transparent;
  border-radius: 10px;
  display: inline-block;
  position: relative;
  flex-direction: row;
}

.mode:hover {
  background-color: orange;
}

.selected {
  background-color: orangered;
  box-shadow: 3px 3px 11px -3px #000000;
}

.mode h3 {
  font-size: 16px;
}

.mode img {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}

.mode:hover .tooltip {
  display:inline-block;
  position: absolute;
  background-color: #000000cc;
  color: white;
  opacity: 1;
}

.tooltip {
  display: none;
  opacity: 0;
  text-align: center;
  padding: 1px;
  z-index: 10;
  width: 50px;
  left: 15px;
  bottom: 0px;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  font-size: 12px;
  line-height: 1.5;
}

#details {
  padding-left: 16px;
  font-size: 1.1em;
  font-weight: 100;
}

</style>
