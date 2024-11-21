<template>
  <div class="question-view">
    <div class="CosasAdmin">

      <button v-if="username === 'admin'" @click="openScoreModal" class="btnAjustar">Ajustes de cuentas</button>
      <div v-if="showScoreModal" class="modal-overlay">
        <div class="modal">
          <div v-for="(player, index) in players" :key="index" class="player-row">
            <p>{{ player.username }}</p>
            <div class="buttons">
              <button @click="adjustScore(player, 0.1)" class="btnSuma">+</button>
              <button @click="adjustScore(player, -0.1)" class="btnResta">-</button>
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

      <img src="../assets/caimanRoom.png" alt="Caimán" width="150" height="150">

    </div>



    <div v-if="username === 'admin'" class="question-section">
      <div class="enunciado">
        <p> {{ currentQuestion.id }} . {{ currentQuestion.question }}</p>
      </div>
      <div class="option-grid">
        <div v-for="(option, index) in currentQuestion.options" :key="index"
          :class="['option', getOptionClass(index), { selected: selectedOption === index }]"
          @click="selectOption(index)">
          {{ option }}
        </div>
      </div>
      <button class="resolve-button" @click="resolver()">RESOLVER</button>
      <button class="next-button" @click="next()">SIGUIENTE PREGUNTA</button>
    </div>

    <div v-else class="player-buttons">
      <div class="preguntaUsuario">
        <p> {{ currentQuestion.id }} . {{ currentQuestion.question }}</p>
      </div>
      <div class="button-grid">
        <button v-for="(option, index) in currentQuestion.options" :key="index" @click="selectOption(index)"
          :class="['option', getOptionClass(index), { selected: selectedOption === index }]">

          {{ option }}
        </button>
      </div>
      <button class="action-button" @click="submitAnswer">Enviar respuesta</button>
    </div>
  </div>
</template>


<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      ip: '192.168.1.35',
      playerName: '',
      playerImage: '',
      questionText: '',
      options: [],
      selectedOption: null,
      username: '',
      questions: [],
      currentQuestionIndex: 0,
      loading: true,
      error: null,
      playerAnswers: [],
      showScoreModal: false, // Estado del modal
      players: [{ username: '', score: 0 }], // Array para almacenar los jugadores conectados
      logo: '../assets/caimanRoom.png',
      currentQuestion: { question: '', options: [], correctAnswer: 0 },
    };
  },
  async created() {
    this.currentQuestionIndex = 0;
    this.username = this.$route.query.username; // Obtener el nombre de usuario de la ruta

    this.socket = io(); // Conectar al servidor
    this.socket.on('newQuestion', (question) => {
      this.currentQuestion = question;
    });

    this.socket.on('new-answer', (data) => {
      this.playerAnswers.push(data);
      console.log('Respuestas de los jugadores:', this.playerAnswers);


    });

    this.socket.on('resolve-results', (results) => {
      // Aquí puedes mostrar los resultados o actualizar el estado de los jugadores
      console.log('Resultados de la resolución:', results);
    });

    this.socket.on('redirect-to-trivia-room', () => {
      this.$router.push({
        name: 'trivia-room',
        query: {
          username: this.username,
        }
      });
    });

    try {
      // llamar a la api con la ip del servidor
      const response = await fetch(`http://${this.ip}:8000/getQuestionsKahoot`);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('data', data);

      this.questions = data.questions;

      this.currentQuestion = this.questions[this.currentQuestionIndex];
    } catch (err) {
      console.error('Error al cargar las preguntas:', err);
      this.error = 'Error al cargar las preguntas';
      this.loading = false;
    }

    try {
      const response = await fetch(`http://${this.ip}:8000/getConnectedPlayers`);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('data', data);
      this.players = data.players; // Asignar correctamente los jugadores recibidos

    } catch (error) {
      this.error = 'Error al cargar los jugadores';
    }
  },
  methods: {
    selectOption(index) {
      this.selectedOption = index;
    },
    openScoreModal() {
      this.showScoreModal = true;
    },
    closeScoreModal() {
      this.showScoreModal = false;
    },
    adjustScore(player, delta) {
      player.score += delta;
      if (player.score < 0) {
        player.score = 0;
      }
    },
    async next() {
      console.log('currentQuestion.id', this.currentQuestion.id);
      console.log('questions.length', this.questions.length);
      if (this.currentQuestion.id === this.questions.length ) {
        // push al path TriviaRoom con el username y los players

        const response = await fetch(`http://${this.ip}:8000/updatePlayers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ players: this.players }),
        });
        const data = await response.json();
        console.log('data', data);

        this.socket.emit('redirect-to-trivia-room');

        //  this.$router.push({ name: 'trivia-room', query: { username: this.username, players: this.players } });
        return;
      }
      else {
        this.currentQuestionIndex++;
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.selectedOption = null;
        this.socket.emit('nextQuestion', this.currentQuestion);

        // Limpiar las clases de las opciones
        const options = document.getElementsByClassName('option');
        for (let i = 0; i < options.length; i++) {
          options[i].classList.remove('opcion-correcta');
          options[i].classList.remove('opcion-incorrecta');
        }
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

      // Marcar la respuesta como enviada y mostrar el texto de la respuesta
      alert(`Respuesta enviada: ${this.currentQuestion.options[this.selectedOption]}`);
      // bloqueamos el boton de enviar
      this.selectedOption = null;

    },

    getOptionClass(index) {
      const colors = ['blue', 'green', 'orange', 'yellow'];
      return colors[index] || '';
    },
    resolver() {
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
        console.log('playerAnswer.answer', playerAnswer.answer);
        console.log('this.currentQuestion.correctAnswer', this.currentQuestion.correctAnswer);
        if (playerAnswer.answer === this.currentQuestion.correctAnswer) {
          // sumamos un punto al jugador
          this.players.forEach((player) => {
            if (player.username === playerAnswer.player) {
              player.score = player.score + 0.1;
            } else {
              console.log('No se ha encontrado el jugador');

            }
          });
        }
      });

      // limpiamos las respuestas de los jugadores
      this.playerAnswers = [];
    }
  },
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
  gap: 1rem;
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

.CosasAdmin {
  display: flex;
  flex-direction: row;
  gap: 3rem;
}

.question-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: bisque;
  height: 100vh;
  padding: 1rem;
  overflow: hidden;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: #2a6b2c;
  padding: 15px 32px;
  border-radius: 5px;
  /* text white */
  color: white;
}

.players {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.player-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  /* bold */
  font-weight: bold;
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

.player-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
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

.preguntaUsuario {
  background-color: ghostwhite;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
}

.player-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
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
  background-color: #2a6b2c;
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
  background-color: #2a6b2c;
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