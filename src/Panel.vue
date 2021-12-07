<template>
    <div id="panel">
        <h1>Générateur de balade</h1>
        <div class="cat">
          <h3>Mode de déplacement</h3>
          <div id="modes">
            <div :class="mode "
              v-for="mode in modes"
                :key="mode.id"
                v-on:click="selectMode($event, mode)">
              <img :src="require('./img/' + mode.image)" />
            </div>
          </div>
        </div>
        <div class="cat">
          <h3>Détails de la balade</h3>
          <div id="details">
            <div>{{km}}</div>
            <div>{{h}}</div>
          </div>
        </div>
    </div>
</template>

<script>

export default {
  name: 'Panel',
  data() {
    return {
      modes: [{
            id: 'grandma_dog',
            image: 'grandma_dog.jpg',
            speed: 1, // km/h
            mode: 'foot',
            selected: false
        }, {
            id: 'dujardin_peignoir',
            image: 'dujardin_peignoir.jpg',
            speed: 2,
            mode: 'foot',
            selected: false
        }, {
            id: 'poussette',
            image: 'poussette.jpg',
            speed: 3,
            mode: 'foot',
            selected: false
        },{
            id: 'marche-urbaine',
            image: 'marche-urbaine.jpg',
            speed: 4.2,
            mode: 'foot',
            selected: true
        },{
            id: 'marche-nordique',
            image: 'marche-nordique.jpg',
            speed: 7,
            mode: 'foot',
            selected: false
        },{
            id: 'running_dog',
            image: 'running_dog.png',
            speed: 10,
            mode: 'foot',
            selected: false
        }],
      expectedTime: 0.5, // heures
      speed: 4.2,
      mode: 'foot',
      details: ''
    }
  },
  methods: {
      selectMode(e, mode) {
          console.log("select mode " + mode.id)
          for(var m in this.modes) {
            let mod = this.modes[m]
            if(mod === mode) {
              mod.selected = true
              this.speed = mod.speed
              this.mode = mod.mode
            } else {
              mod.selected = false
            }
          }
      }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#panel {
  position: absolute;
  background-color: #000012bb;
  left: 0px;
  top: 0px;
  width: 300px;
  height: 100%;
  color: white;
  text-align: left;
  padding: 10px;
  z-index: 1005;
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
  margin-top: 10px;
}

.cat {
  background-color: #aaaaaa33;
  border-radius: 10px;
  padding: 5px 0px 5px 0px;
  margin-bottom: 10px;
}

#modes {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  margin: 0px auto;
  position: relative;
  text-align:center;
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
  
}

.mode:hover {
  background-color: orange
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

#details {
  padding-left: 6px;
}

</style>
