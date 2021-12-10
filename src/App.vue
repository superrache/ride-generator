<template>
  <Map/>
</template>

<script>
import Map from './Map.vue'

export default {
  name: 'App',
  components: {
    Map
  },
  async created() {
    await fetch('https://dept-quiz.herokuapp.com/stat?feature=ride-generator')
  }
}
</script>

<style>
html,
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  background-color: #343434;
  overflow: hidden;
}

#app {
  user-select: none;
  color: white;
  width: 100%;
  height: 100%;
  margin: 0;
}

</style>
