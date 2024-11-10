<template>
    <div class="trivia-room">
      <h1>Sala de Trivia</h1>
      <p>Bienvenido, {{ username }}.</p>
      
      <div class="player-info">
        <b>Jugadores:</b>
        <div class="players">
          <div v-for="(player, index) in players" :key="index" class="player-details">
            <p>{{ player.username }}</p>
            <p>Puntaje: {{ player.score }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        username: this.$route.query.username,
        players: this.$route.query.players,
      };
    },
  };
  </script>
  
  <style scoped>
  .trivia-room {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .player-info {
    margin-top: 20px;
    background-color: #28a745;
    padding: 25px;
    border-radius: 10px;
    color: white;
  }
  
  .players {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .player-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    font-weight: bold;
  }
  </style>
  