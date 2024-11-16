<template>
  <div class="trivia-room">

    <div class="CosasAdmin">
      <button v-if="username === 'admin'" @click="openScoreModal" class="btnAjustar">Ajustes de cuentas</button>
      <div v-if="showScoreModal" class="modal-overlay">
        <div class="modal">
          <div v-for="(player, index) in players" :key="index" class="player-row">
            <p>{{ player.username }}</p>
            <div class="buttons">
              <button @click="adjustScore(player, 1)" class="btnSuma">+</button>
              <button @click="adjustScore(player, -1)" class="btnResta">-</button>
            </div>
            <p>Puntuación: {{ player.score }}</p>
          </div>
          <button class="close-button" @click="closeScoreModal">Cerrar</button>
        </div>
      </div>
      <div v-if="username === 'admin'" class="player-info">
        <div class="players">
          <div v-for="(player, index) in players" :key="index" class="player-details">

            <p>{{ player.username }}</p>
            <p>{{ player.score }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="username === 'admin'" class="question-section">
      <div>
        <div class="turno">
          <b>Turno de:</b> <br>
          <p>{{ turno }}</p>
        </div>
        <div class="enunciado">
          <p>{{ currentQuestion.question }}</p>
        </div>
        <div class="option-grid">
          <div v-for="(option, index) in currentQuestion.options" :key="index"
            :class="['option', getOptionClass(index), { selected: selectedOption === index }]">
            {{ option }}
          </div>
        </div>
      </div>

      <button class="resolve-button" @click="resolver()">RESOLVER</button>
      <button class="next-button" @click="siguientePregunta()">SIGUIENTE PREGUNTA</button>
    </div>

  </div>

  <div v-if="turno === this.username" class="user">
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
      showScoreModal: false,
      playerAnswers: [],
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
      console.log('Preguntas:', this.questions);

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

    this.socket.on('new-answer', (data) => {
      this.playerAnswers.push(data);
      console.log('Respuestas de los jugadores:', this.playerAnswers);

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
    openScoreModal() {
      this.showScoreModal = true;
    },
    closeScoreModal() {
      this.showScoreModal = false;
    },
    adjustScore(player,delta){
      player.score += delta;
      if(player.score < 0){
        player.score = 0;
      }
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

      // Limpiar las clases de las opciones
      const options = document.getElementsByClassName('option');
      for (let i = 0; i < options.length; i++) {
        options[i].classList.remove('opcion-correcta');
        options[i].classList.remove('opcion-incorrecta');
      }

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

    }, resolver() {
      // haremos que cuando el admin presione el botón de resolver, la opcion de la respuesta correcta se pinte de verde y el resto de rojo

      this.currentQuestion.options.forEach((option, index) => {
        // si la opcion es la correcta

        if ((index) === this.currentQuestion.correctAnswer) {
          // pintamos la opcion de verde
          document.getElementsByClassName('option')[index].classList.add('opcion-correcta');

        } else {
          // pintamos el resto de opciones de rojo
          document.getElementsByClassName('option')[index].classList.add('opcion-incorrecta');
        }
      });

      // comprobar los players answers y actualizar los puntos de los jugadores
      // por cada respuesta de los jugadores
      this.playerAnswers.forEach((playerAnswer) => {
        // si la respuesta del jugador es igual a la respuesta correcta
        if (playerAnswer.answer === this.currentQuestion.correctAnswer) {
          // sumamos un punto al jugador
          this.players.forEach((player) => {
            if (player.username === playerAnswer.player) {
              player.score++;
              console.log('player.score', player.score);
            } else {
              console.log('player.score', player.score);

            }
          });
        }
      });

      // limpiamos las respuestas de los jugadores
      this.playerAnswers = [];
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  display: flex;
  flex-direction: row;
  background: white;
  gap: 1rem;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  text-align: center;
}

.btnAjustar {
  background-color: #2a6b2c;
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
  border-radius: 5px;
}

.close-button {
  background: red;
  color: white;
}

.btnSuma {
  background-color: #28a745;
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
  border-radius: 5px;
}

.btnResta {
  background-color: #dc3545;
  /* Red */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
}

.trivia-room {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.CosasAdmin {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.user{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.player-info {
  margin-top: 20px;
  background-color: #2a6b2c;
  border-radius: 10px;
  color: white;
}

.turno {
  margin-top: 20px;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
}

.players {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.player-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-weight: bold;
  padding: 25px;
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
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
  overflow: hidden;
  height: 50%;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 80%;
  margin: 20px 50px 20px 50px;
}

.player-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 10px;
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
  margin: 50px 50px 50px 50px;
  cursor: pointer;
  border-radius: 5px;
  width: 80%;
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