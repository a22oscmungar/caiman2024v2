<template>
  <div class="trivia-room">

    <div v-if="username === 'admin'" class="player-info">
      <b>Puntuaciones:</b> <br>
      <div class="players">
        <div v-for="(player, index) in players" :key="index" class="player-details">

          <p>{{ player.username }}</p>
          <p>{{ player.score }}</p>
        </div>
      </div>
    </div>

    <div v-if="username === 'admin'">
      <b>Turno de:</b> <br>
      <p>{{ turno }}</p>

      <div class="question-section">
        <div class="enunciado">
          <p>{{ currentQuestion.question }}</p>
        </div>
        <div class="option-grid">
          <div v-for="(option, index) in currentQuestion.options" :key="index"
            :class="['option', getOptionClass(index), { selected: selectedOption === index }]"
            @click="selectOption(index)">
            {{ option }}
          </div>
        </div>
      </div>

      <button class="resolve-button" @click="resolver()">RESOLVER</button>
      <button class="next-button" @click="siguientePregunta()">SIGUIENTE PREGUNTA</button>
    </div>

  </div>

  <div v-if="turno === this.username">
    <div class="option-grid">
      <div v-for="(option, index) in currentQuestion.options" :key="index"
        :class="['option', getOptionClass(index), { selected: selectedOption === index }]" @click="selectOption(index)">
        {{ option }}
      </div>
    </div>
    <button class="action-button" @click="submitAnswer">Enviar respuesta</button>
  </div>


</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      username: this.$route.query.username,
      players: [{ username: '', score: 0 }],
      questions: [],
      loading: true,
      error: null,
      currentQuestionIndex: 0,
      currentQuestion: { question: '', options: [], correctAnswer: 0 },
      selectedAnswer: null,
      turnoIndex: 0,
      turno: '',
    };
  },
  async created() {
    this.socket = io(); // Conectar al servidor


    try {
      const response = await fetch('http://localhost:8000/getPlayers');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      this.players = data.players;
      this.turno = this.players[this.turnoIndex].username;
    } catch (err) {
      console.error('Error al obtener los players:', err);
      this.error = 'Error al obtener los players. Intente de nuevo más tarde.';
      this.loading = false;
    }

    try {
      const response = await fetch('http://localhost:8000/getQuestionsTrivia');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      //las preguntas estaran en orden aleatirio

      this.questions = data.questions;
      console.log('Preguntas:' , this.questions);

      this.currentQuestion = this.questions[this.currentQuestionIndex];
    } catch (err) {
      console.error('Error al obtener las preguntas:', err);
      this.error = 'Error al obtener las preguntas. Intente de nuevo más tarde.';
      this.loading = false;
    }

    this.socket.on('nuevo-turno', (turno) => {
      this.turno = turno;
    });

    this.socket.on('nueva-pregunta', (pregunta) => {
      this.currentQuestion = pregunta;
    });
  },
  methods: {

    getOptionClass(index) {
      const colors = ['blue', 'green', 'orange', 'yellow'];
      return colors[index] || '';
    },
    elegirJugador() {
      this.turnoIndex++;
      if (this.turnoIndex === this.players.length) {
        this.turnoIndex = 0;
      }
      this.turno = this.players[this.turnoIndex].username;

      this.socket.emit('nuevo-turno', this.turno);
    },
    selectOption(index) {
      this.selectedOption = index;
    },
    siguientePregunta() {
      this.elegirJugador();
      // Elimina la pregunta actual
      this.currentQuestionIndex = 0;

      this.questions.splice(this.currentQuestionIndex, 1);

      // Bucle para encontrar una pregunta válida para el jugador en turno
      while (this.questions.length > 0) {
        // Asigna la primera pregunta como candidata
        this.currentQuestion = this.questions[this.currentQuestionIndex];

        // Verifica si el turno del jugador está en el campo 'about' de la pregunta
        if (!this.currentQuestion.about || !this.currentQuestion.about.includes(this.turno)) {
          // Si no está en el 'about', es válida, así que se sale del bucle
          break;
        }

        // Si está en el 'about', elimina la pregunta actual y sigue buscando
        this.currentQuestionIndex++;
      }

      // Reinicia el índice si llega al final del array
      if (this.currentQuestionIndex >= this.questions.length) {
        this.currentQuestionIndex = 0;
      }

      // Si no quedan preguntas válidas, muestra mensaje de finalización
      if (this.questions.length === 0) {
        this.currentQuestion = null;
        console.log("No hay más preguntas disponibles.");
      }

      // Emitir la pregunta actual al servidor mediante sockets
      this.socket.emit('nueva-pregunta', this.currentQuestion);
    },
    submitAnswer() {
      if (this.selectedOption === null) {
        alert('Por favor selecciona una respuesta.');
        return;
      }

      // Emitir la respuesta del jugador al servidor mediante sockets
      this.socket.emit('submit-answer', {
        player: this.username,
        answer: this.selectedOption, // Restar 1 para que coincida con el índice de la respuesta correcta
      });

      // Marcar la respuesta como enviada
      alert(`Respuesta enviada con indice: ${this.selectedOption}`);
      this.selectedOption = null;

    }
  }
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

.question-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: antiquewhite;
  height: 100vh;
  padding: 1rem;
  overflow: hidden;
}


.question-section {
  background-color: white;
  padding: 80px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin: 20px 0;
}

.option {
  padding: 20px;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 5px;
  text-align: center;
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.blue {
  background-color: #007bff;
}

.green {
  background-color: #28a745;
}

.orange {
  background-color: #c48614;
}

.yellow {
  background-color: purple;
}

.action-button {
  background-color: #6c757d;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.action-button:hover {
  background-color: #5a6268;
}


.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin: 0;
  margin-top: 20%;
}

/* button grid al ser presionado */
.button-grid button.selected {
  background-color: pink;
  border-color: black !important;
}

.button-grid:disabled {
  background-color: grey;
}

button {
  padding: 50px;
  border-radius: 5px;
  cursor: pointer;
  color: white;
  border: none;
  transition: background-color 0.3s;
}

.button-grid button:nth-child(1) {
  background-color: #007bff;
  /* Azul */
}

.button-grid button:nth-child(2) {
  background-color: #28a745;
  /* Verde */
}

.button-grid button:nth-child(3) {
  background-color: #dc3545;
  /* Rojo */
}

.button-grid button:nth-child(4) {
  background-color: purple;
  /* Amarillo */
}

.resolve-button {
  background-color: grey;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;

}

.next-button {
  background-color: grey;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.resolve-button:hover,
.next-button:hover {
  background-color: green;
}

.opcion-correcta {
  background-color: green;
}

.opcion-incorrecta {
  background-color: red;
}
</style>