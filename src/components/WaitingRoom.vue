<template>
  <div class="waiting-room">
    <h2>Sala de Espera</h2>
    <img src="../assets/logowaiting.png" alt="Caimán" width="200" height="200">
    <p>Jugadores conectados:</p>
    <ul>
      <li v-for="player in filteredPlayers" :key="player">{{ player }}</li>
    </ul>
    <div v-if="this.username == 'admin'">
      <button class="btnEmpezar" @click="startGame">Iniciar test</button>
    </div>
    <div v-else>
      <p>Esperando a que el caimán inicie el test...</p>
    </div>

  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      connectedPlayers: [], // Aquí se almacenarán los jugadores conectados
      socket: null,
      username: '',
    };
  },
  mounted() {
    this.socket.on('redirect-to-question', () => {
      this.$router.push({ path: '/question-view', query: { username: this.username } });
    });
  },
  computed: {
    filteredPlayers() {
      // Filtramos jugadores no válidos (por ejemplo, eliminando espacios en blanco)
      return this.connectedPlayers.filter(player => player && player.trim().length > 0);
    }
  },
  created() {
    this.socket = io(); // Conectar al servidor

    // Obtener el nombre de usuario desde los parámetros de la ruta
    this.username = this.$route.query.username;
    this.socket.emit('set-username', this.username);

    // Escuchar la lista de jugadores conectados
    this.socket.on('current-players', (players) => {
      this.connectedPlayers = players; // Inicializa la lista al conectarse
    });

    // Escuchar actualizaciones de la lista de jugadores
    this.socket.on('update-players', (players) => {
      this.connectedPlayers = players; // Actualiza la lista cuando hay un cambio
    });

    // Escuchar si hay un usuario desconectado
    this.socket.on('user-disconnected', (username) => {
      console.log(`${username} se ha desconectado`);
      this.connectedPlayers = this.connectedPlayers.filter(player => player !== username);
    });
  },
  methods: {
    async startGame() {
      try {
        const response = await fetch('http://localhost:8000/start-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: this.username }),
        });

        const data = await response.json();

        if (data.success) {
          // Emitir evento a través del socket para redirigir a todos los usuarios
          this.socket.emit('redirect-to-question');
        } else {
          alert(data.error || 'Error desconocido');
        }
      } catch (error) {
        console.error('Error al iniciar el test:', error);
      }
    }
  }

};
</script>

<style scoped>
.waiting-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f4f4f4;
  text-align: center;
}

h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 1rem;
}

ul {
  list-style: none;
  padding: 0;
  width: 100%;
  max-width: 400px;
}

li {
  background-color: #fff;
  padding: 10px;
  margin: 0.5rem 0;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  color: #333;
}

.btnEmpezar {
  background-color: #4CAF50;
  /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
}
</style>
